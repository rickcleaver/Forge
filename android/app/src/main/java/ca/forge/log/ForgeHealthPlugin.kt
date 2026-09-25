package ca.forge.log

import android.content.Intent
import android.net.Uri
import android.webkit.WebView
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.concurrent.Executors

/**
 * Real Health Connect bridge for Forge.
 *
 * Checks availability, requests read permissions, queries recent metrics, and
 * posts into the existing web ingest path:
 *   window.forgeApplyHealth / postMessage
 *   { type: "forge-health", source: "health-connect", steps?, weightLb?, sleepHrs?, readiness? }
 *
 * Matches src/lib/health-connect.ts + src/lib/forge-health-plugin.ts.
 */
@CapacitorPlugin(name = "ForgeHealth")
class ForgeHealthPlugin : Plugin() {

  private val io = Executors.newSingleThreadExecutor()

  private val readPermissions: Set<String> = setOf(
    HealthPermission.getReadPermission(StepsRecord::class),
    HealthPermission.getReadPermission(WeightRecord::class),
    HealthPermission.getReadPermission(SleepSessionRecord::class),
    HealthPermission.getReadPermission(HeartRateRecord::class),
    HealthPermission.getReadPermission(RestingHeartRateRecord::class),
  )

  @PluginMethod
  fun isNativeShell(call: PluginCall) {
    io.execute {
      try {
        call.resolve(buildStatus())
      } catch (e: Exception) {
        val ret = JSObject()
        ret.put("native", true)
        ret.put("healthConnectReady", false)
        ret.put("available", false)
        ret.put("sdkStatus", "error")
        ret.put("note", e.message ?: "status failed")
        call.resolve(ret)
      }
    }
  }

  @PluginMethod
  fun getStatus(call: PluginCall) {
    isNativeShell(call)
  }

  @PluginMethod
  fun openHealthConnectSettings(call: PluginCall) {
    try {
      val intent = Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
      activity.startActivity(intent)
      call.resolve()
    } catch (e: Exception) {
      try {
        // Fallback: Play Store Health Connect listing
        val market = Intent(
          Intent.ACTION_VIEW,
          Uri.parse("market://details?id=com.google.android.apps.healthdata"),
        )
        activity.startActivity(market)
        call.resolve()
      } catch (e2: Exception) {
        call.reject("Could not open Health Connect settings", e2)
      }
    }
  }

  /**
   * Launch the Health Connect permission sheet for required read scopes.
   * Resolves with the same status shape as getStatus after the sheet closes.
   */
  @PluginMethod
  fun requestReadPermissions(call: PluginCall) {
    try {
      val status = HealthConnectClient.getSdkStatus(context)
      if (status == HealthConnectClient.SDK_UNAVAILABLE) {
        call.reject("Health Connect is not available on this device.")
        return
      }
      if (status == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
        call.reject("Install or update Health Connect from the Play Store, then try again.")
        return
      }
      val contract = PermissionController.createRequestPermissionResultContract()
      val intent = contract.createIntent(context, readPermissions)
      startActivityForResult(call, intent, "onHcPermissions")
    } catch (e: Exception) {
      call.reject("Could not request Health Connect permissions", e)
    }
  }

  @ActivityCallback
  private fun onHcPermissions(call: PluginCall, result: ActivityResult) {
    io.execute {
      try {
        call.resolve(buildStatus())
      } catch (e: Exception) {
        call.reject("Permission result handling failed", e)
      }
    }
  }

  /**
   * Query recent HC data and push into the web ingest path.
   * Also returns the snapshot fields so the JS layer can apply immediately.
   */
  @PluginMethod
  fun readAndPublish(call: PluginCall) {
    io.execute {
      try {
        val status = HealthConnectClient.getSdkStatus(context)
        if (status != HealthConnectClient.SDK_AVAILABLE) {
          call.reject(sdkStatusMessage(status))
          return@execute
        }
        val client = HealthConnectClient.getOrCreate(context)
        val granted = runBlocking(Dispatchers.IO) {
          client.permissionController.getGrantedPermissions()
        }
        val hasCore = granted.contains(HealthPermission.getReadPermission(StepsRecord::class)) ||
          granted.contains(HealthPermission.getReadPermission(WeightRecord::class)) ||
          granted.contains(HealthPermission.getReadPermission(SleepSessionRecord::class))
        if (!hasCore) {
          call.reject("No Health Connect read permissions granted. Tap Connect first.")
          return@execute
        }

        val snap = runBlocking(Dispatchers.IO) { querySnapshot(client, granted) }
        if (
          !snap.has("steps") &&
          !snap.has("weightLb") &&
          !snap.has("sleepHrs") &&
          !snap.has("restingHr")
        ) {
          // Still publish an empty-ish typed payload? Better reject honestly.
          call.reject("Health Connect returned no steps, weight, or sleep for the recent window.")
          return@execute
        }

        publishToWeb(snap)
        call.resolve(snap)
      } catch (e: SecurityException) {
        call.reject("Health Connect permission denied.", e)
      } catch (e: Exception) {
        call.reject("Health Connect read failed: ${e.message}", e)
      }
    }
  }

  /**
   * Push a health snapshot into the existing web ingest path (tests / manual).
   */
  @PluginMethod
  fun publishHealthSnapshot(call: PluginCall) {
    try {
      val payload = JSObject()
      payload.put("type", "forge-health")
      payload.put("source", "health-connect")
      if (call.hasOption("steps")) payload.put("steps", call.getInt("steps"))
      if (call.hasOption("weightLb")) payload.put("weightLb", call.getDouble("weightLb"))
      if (call.hasOption("sleepHrs")) payload.put("sleepHrs", call.getDouble("sleepHrs"))
      if (call.hasOption("readiness")) payload.put("readiness", call.getInt("readiness"))
      if (call.hasOption("restingHr")) payload.put("restingHr", call.getInt("restingHr"))
      publishToWeb(payload)
      call.resolve(payload)
    } catch (e: Exception) {
      call.reject("publishHealthSnapshot failed", e)
    }
  }

  private fun buildStatus(): JSObject {
    val ret = JSObject()
    ret.put("native", true)
    val status = HealthConnectClient.getSdkStatus(context)
    val available = status == HealthConnectClient.SDK_AVAILABLE
    ret.put("available", available)
    ret.put("sdkStatus", sdkStatusLabel(status))
    ret.put("note", sdkStatusMessage(status))

    if (!available) {
      ret.put("healthConnectReady", false)
      ret.put("permissionsGranted", false)
      return ret
    }

    val client = HealthConnectClient.getOrCreate(context)
    val granted = runBlocking(Dispatchers.IO) {
      client.permissionController.getGrantedPermissions()
    }
    val coreOk =
      granted.contains(HealthPermission.getReadPermission(StepsRecord::class)) ||
        granted.contains(HealthPermission.getReadPermission(WeightRecord::class)) ||
        granted.contains(HealthPermission.getReadPermission(SleepSessionRecord::class))
    ret.put("permissionsGranted", coreOk)
    ret.put("healthConnectReady", coreOk)
    val arr = com.getcapacitor.JSArray()
    for (p in granted) arr.put(p)
    ret.put("grantedPermissions", arr)
    return ret
  }

  private suspend fun querySnapshot(
    client: HealthConnectClient,
    granted: Set<String>,
  ): JSObject {
    val zone = ZoneId.systemDefault()
    val now = Instant.now()
    val startOfToday = LocalDate.now(zone).atStartOfDay(zone).toInstant()
    val out = JSObject()
    out.put("type", "forge-health")
    out.put("source", "health-connect")

    if (granted.contains(HealthPermission.getReadPermission(StepsRecord::class))) {
      val agg = client.aggregate(
        AggregateRequest(
          metrics = setOf(StepsRecord.COUNT_TOTAL),
          timeRangeFilter = TimeRangeFilter.between(startOfToday, now),
        ),
      )
      val steps = agg[StepsRecord.COUNT_TOTAL]
      if (steps != null && steps >= 0) {
        out.put("steps", steps.toInt())
      }
    }

    if (granted.contains(HealthPermission.getReadPermission(WeightRecord::class))) {
      val from = ZonedDateTime.now(zone).minusDays(30).toInstant()
      val response = client.readRecords(
        ReadRecordsRequest(
          recordType = WeightRecord::class,
          timeRangeFilter = TimeRangeFilter.between(from, now),
          ascendingOrder = false,
          pageSize = 1,
        ),
      )
      val latest = response.records.firstOrNull()
      if (latest != null) {
        val lb = latest.weight.inPounds
        if (lb > 40.0 && lb < 800.0) {
          out.put("weightLb", Math.round(lb * 10.0) / 10.0)
        }
      }
    }

    if (granted.contains(HealthPermission.getReadPermission(SleepSessionRecord::class))) {
      // Overnight + recent naps: last 36 hours.
      val from = now.minusSeconds(36L * 3600L)
      val agg = client.aggregate(
        AggregateRequest(
          metrics = setOf(SleepSessionRecord.SLEEP_DURATION_TOTAL),
          timeRangeFilter = TimeRangeFilter.between(from, now),
        ),
      )
      val dur = agg[SleepSessionRecord.SLEEP_DURATION_TOTAL]
      if (dur != null) {
        val hrs = dur.toMinutes() / 60.0
        if (hrs >= 0 && hrs <= 24) {
          out.put("sleepHrs", Math.round(hrs * 10.0) / 10.0)
        }
      }
    }

    if (granted.contains(HealthPermission.getReadPermission(RestingHeartRateRecord::class))) {
      val from = ZonedDateTime.now(zone).minusDays(7).toInstant()
      val response = client.readRecords(
        ReadRecordsRequest(
          recordType = RestingHeartRateRecord::class,
          timeRangeFilter = TimeRangeFilter.between(from, now),
          ascendingOrder = false,
          pageSize = 1,
        ),
      )
      val bpm = response.records.firstOrNull()?.beatsPerMinute
      if (bpm != null && bpm in 21..219) {
        out.put("restingHr", bpm.toInt())
      }
    }

    return out
  }

  private fun publishToWeb(payload: JSObject) {
    val json = payload.toString()
    activity.runOnUiThread {
      val webView: WebView = bridge.webView
      val js =
        "(function(d){try{" +
          "if(typeof window.forgeApplyHealth==='function'){window.forgeApplyHealth(d);}" +
          "window.postMessage(d,'*');" +
          "}catch(e){console.warn('ForgeHealth publish failed',e);}})(" +
          json +
          ");"
      webView.evaluateJavascript(js, null)
    }
  }

  private fun sdkStatusLabel(status: Int): String =
    when (status) {
      HealthConnectClient.SDK_AVAILABLE -> "available"
      HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "update_required"
      HealthConnectClient.SDK_UNAVAILABLE -> "unavailable"
      else -> "unknown"
    }

  private fun sdkStatusMessage(status: Int): String =
    when (status) {
      HealthConnectClient.SDK_AVAILABLE ->
        "Health Connect ready. Grant read permissions, then Sync."
      HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED ->
        "Install or update Health Connect from the Play Store."
      HealthConnectClient.SDK_UNAVAILABLE ->
        "Health Connect is not available on this device."
      else -> "Unknown Health Connect status ($status)."
    }
}

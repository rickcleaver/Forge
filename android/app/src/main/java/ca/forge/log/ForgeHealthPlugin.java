package ca.forge.log;

import android.webkit.WebView;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

/**
 * Stub Health Connect bridge for Forge.
 *
 * Full Health Connect SDK reads can be filled in later. For now this plugin:
 *  - reports that a native shell is present
 *  - can push a JSON health payload into window.forgeApplyHealth / postMessage
 *
 * Payload shape matches src/lib/health-connect.ts:
 * { type: "forge-health", source: "health-connect", steps?, weightLb?, sleepHrs?, readiness? }
 */
@CapacitorPlugin(name = "ForgeHealth")
public class ForgeHealthPlugin extends Plugin {

  @PluginMethod
  public void isNativeShell(PluginCall call) {
    JSObject ret = new JSObject();
    ret.put("native", true);
    ret.put("healthConnectReady", false);
    ret.put("note", "Health Connect SDK read is stubbed — wire androidx.health.connect next.");
    call.resolve(ret);
  }

  @PluginMethod
  public void openHealthConnectSettings(PluginCall call) {
    try {
      android.content.Intent intent =
          new android.content.Intent("androidx.health.ACTION_HEALTH_CONNECT_SETTINGS");
      getActivity().startActivity(intent);
      call.resolve();
    } catch (Exception e) {
      call.reject("Could not open Health Connect settings", e);
    }
  }

  /**
   * Push a health snapshot into the existing web ingest path.
   * Useful for tests and for a future HC reader to call after querying.
   */
  @PluginMethod
  public void publishHealthSnapshot(PluginCall call) {
    try {
      JSONObject payload = new JSONObject();
      payload.put("type", "forge-health");
      payload.put("source", "health-connect");
      if (call.hasOption("steps")) payload.put("steps", call.getInt("steps"));
      if (call.hasOption("weightLb")) payload.put("weightLb", call.getDouble("weightLb"));
      if (call.hasOption("sleepHrs")) payload.put("sleepHrs", call.getDouble("sleepHrs"));
      if (call.hasOption("readiness")) payload.put("readiness", call.getInt("readiness"));

      final String json = payload.toString();
      getActivity().runOnUiThread(() -> {
        WebView webView = getBridge().getWebView();
        String js =
            "(function(d){try{"
                + "if(typeof window.forgeApplyHealth==='function'){window.forgeApplyHealth(d);}"
                + "window.postMessage(d,'*');"
                + "}catch(e){console.warn('ForgeHealth publish failed',e);}})("
                + json
                + ");";
        webView.evaluateJavascript(js, null);
      });
      call.resolve();
    } catch (Exception e) {
      call.reject("publishHealthSnapshot failed", e);
    }
  }
}

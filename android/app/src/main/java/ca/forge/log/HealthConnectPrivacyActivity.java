package ca.forge.log;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

/**
 * Health Connect requires a visible privacy / permissions-rationale activity.
 * We open Forge's public privacy page (also used by the PWA).
 */
public class HealthConnectPrivacyActivity extends Activity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://forgelog.ca/privacy"));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    startActivity(intent);
    finish();
  }
}

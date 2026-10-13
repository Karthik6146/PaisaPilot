package com.karthik.paisapilot;

import static org.junit.Assert.*;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.security.NetworkSecurityPolicy;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class AppSecurityTest {
    @Test
    public void privateAppDisallowsBackupAndCleartext() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("com.karthik.paisapilot", context.getPackageName());
        assertEquals(0, context.getApplicationInfo().flags & ApplicationInfo.FLAG_ALLOW_BACKUP);
        assertFalse(NetworkSecurityPolicy.getInstance().isCleartextTrafficPermitted("paisa-pilot-umber.vercel.app"));
    }
}

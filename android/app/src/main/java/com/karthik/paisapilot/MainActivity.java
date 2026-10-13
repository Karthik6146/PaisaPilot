package com.karthik.paisapilot;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppAppearancePlugin.class);
        super.onCreate(savedInstanceState);
    }
}

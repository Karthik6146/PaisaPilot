package com.karthik.paisapilot;

import android.graphics.Color;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppAppearance")
public class AppAppearancePlugin extends Plugin {
    @PluginMethod
    public void setTheme(PluginCall call) {
        String theme = call.getString("theme");
        if (!"light".equals(theme) && !"dark".equals(theme)) {
            call.reject("Unknown theme");
            return;
        }
        getBridge().executeOnMainThread(() -> {
            boolean dark = "dark".equals(theme);
            // Older WebViews use native margins; SystemBars reads this theme on rotation too.
            getActivity().getTheme().applyStyle(dark ? R.style.AppSurfaceDark : R.style.AppSurfaceLight, true);
            getActivity().getWindow().getDecorView().setBackgroundColor(Color.parseColor(dark ? "#111914" : "#f7f8f4"));
            call.resolve();
        });
    }
}

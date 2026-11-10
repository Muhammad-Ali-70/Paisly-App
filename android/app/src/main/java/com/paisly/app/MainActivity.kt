package com.paisly.app

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle
import androidx.core.content.pm.ShortcutManagerCompat
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory


class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Paisly"

  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(savedInstanceState)
    // Launcher shortcuts are static now (res/xml/shortcuts.xml). Builds up to
    // 1.0.3 registered dynamic ones via react-native-quick-actions; those survive
    // app updates and would show twice, so drop them.
    try {
      ShortcutManagerCompat.removeAllDynamicShortcuts(this)
    } catch (_: Exception) {
    }
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}

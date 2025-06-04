@echo off
"C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\java" ^
  --class-path ^
  "C:\\Users\\natha\\.gradle\\caches\\modules-2\\files-2.1\\com.google.prefab\\cli\\2.1.0\\aa32fec809c44fa531f01dcfb739b5b3304d3050\\cli-2.1.0-all.jar" ^
  com.google.prefab.cli.AppKt ^
  --build-system ^
  cmake ^
  --platform ^
  android ^
  --abi ^
  x86 ^
  --os-version ^
  24 ^
  --stl ^
  c++_shared ^
  --ndk-version ^
  27 ^
  --output ^
  "C:\\Users\\natha\\AppData\\Local\\Temp\\agp-prefab-staging5150955489596003829\\staged-cli-output" ^
  "C:\\Users\\natha\\.gradle\\caches\\8.10.2\\transforms\\d04e401f6db98d4307004fde50158b02\\transformed\\react-android-0.77.1-debug\\prefab" ^
  "C:\\Users\\natha\\OneDrive\\Documents\\GitHub\\Refrigerator-Management-Project\\android\\app\\build\\intermediates\\cxx\\refs\\react-native-reanimated\\6n674s40" ^
  "C:\\Users\\natha\\.gradle\\caches\\8.10.2\\transforms\\4fea562f4f21af394f37ff344d75971c\\transformed\\hermes-android-0.77.1-debug\\prefab" ^
  "C:\\Users\\natha\\.gradle\\caches\\8.10.2\\transforms\\d7d422c0963f92aa7b8a765f3bd54231\\transformed\\fbjni-0.7.0\\prefab"

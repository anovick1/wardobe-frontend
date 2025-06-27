import React from "react";
import { View, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { WebView } from "react-native-webview";
import ViewShot from "react-native-view-shot";
import { shouldAllowUrl } from "../../utils/nsfwFilter";

const WebViewSection = ({
  viewShotRef,
  webViewRef,
  urlInput,
  setProductUrl,
  isMounted,
  setViewReady,
  onNavigationStateChange,
}) => {
  const handleShouldStartLoadWithRequest = (request) => {
    const { url } = request;

    if (!shouldAllowUrl(url)) {
      Alert.alert(
        "Content Blocked",
        "This website has been blocked for containing inappropriate content.",
        [{ text: "OK" }],
      );

      return false;
    }

    return true;
  };

  return (
    <ViewShot
      ref={viewShotRef}
      style={styles.webViewContainer}
      options={{ format: "jpg", quality: 0.9 }}
      collapsable={false}
      onLayout={() => setViewReady(true)}
    >
      <WebView
        ref={webViewRef}
        source={{ uri: urlInput }}
        style={styles.webView}
        onNavigationStateChange={(navState) => {
          if (isMounted.current && navState.url) {
            setProductUrl(navState.url);
          }
          if (onNavigationStateChange) {
            onNavigationStateChange(navState);
          }
        }}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        )}
      />
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  webViewContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default WebViewSection;

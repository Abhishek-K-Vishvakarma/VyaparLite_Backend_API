import firebaseAdmin from "../config/firebase.js";

export const sendPushNotification = async ({ fcmToken, title, body, data = {} }) => {
  if (!fcmToken) return;
  const message = {
    token: fcmToken,
    notification: {
      title,
      body
    },
    data
  };
  try {
    await firebaseAdmin.messaging().send(message);
    console.log("FCM notification sent");
  } catch (error) {
    console.error("FCM Error:", error.message);
  }
};

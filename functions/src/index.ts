import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

export const sendChatMessageNotification = onDocumentCreated("dogs/{petId}/chats/{chatId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }

    const chatMessage = snapshot.data();
    const petId = event.params.petId;
    const senderId = chatMessage.senderId;
    const senderName = chatMessage.senderName;
    const messageText = chatMessage.messageText;

    // Get pet members
    const petDoc = await db.collection("dogs").doc(petId).get();
    const petData = petDoc.data();

    if (!petData || !petData.members) {
      console.log("Pet or members not found.");
      return;
    }

    const memberIds = petData.members as string[];

    // Get FCM tokens for all members except the sender
    const recipientTokens: {token: string, userId: string}[] = [];
    for (const memberId of memberIds) {
      if (memberId === senderId) continue; // Don't send notification to the sender

      const userProfileDoc = await db.collection("users").doc(memberId).get();
      const userProfile = userProfileDoc.data();

      if (userProfile && userProfile.fcmTokens && userProfile.fcmTokens.length > 0) {
        const uniqueTokens: string[] = Array.from(new Set(userProfile.fcmTokens.filter((token: string) => typeof token === 'string')));
        uniqueTokens.forEach(token => {
            recipientTokens.push({token, userId: memberId});
        });
      }
    }

    if (recipientTokens.length === 0) {
      console.log("No recipient tokens found.");
      return;
    }

    // Construct the notification message
    const payload: admin.messaging.MessagingPayload = {
      notification: {
        title: `${senderName} から ${petData.name} のチャットにメッセージが届きました`, // Pet name is used here
        body: messageText,
        icon: chatMessage.senderProfileImageUrl || '/icon-192x192.png', // Sender's profile image or default
        click_action: `https://aina-life-dev.web.app/chat/pets/${petId}/chat` // URL to open when notification is clicked
      },
      data: {
        petId: petId,
        chatId: snapshot.id,
        url: `https://aina-life-dev.web.app/chat/pets/${petId}/chat`
      }
    };

    const tokensToSend = recipientTokens.map(t => t.token);

    // Send notifications to all unique recipient tokens
    try {
      const response = await admin.messaging().sendToDevice(tokensToSend, payload);
      console.log("Successfully sent message:", response);

      // Clean up invalid tokens (optional but recommended)
      const tokensToRemove: Promise<admin.firestore.WriteResult>[] = [];
      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          const recipient = recipientTokens[index];
          console.error("Failure sending notification to", recipient.token, error);
          // Cleanup the token from the user's profile
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            tokensToRemove.push(
              db.collection("users").doc(recipient.userId).update({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(recipient.token)
              })
            );
          }
        }
      });
      await Promise.all(tokensToRemove);

    } catch (error) {
      console.error("Error sending message:", error);
    }
});

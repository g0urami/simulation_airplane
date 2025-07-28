public class GroupChat {
    Auth[] auth;
    String[] chat;
    String chatID;
    GroupChat(Auth[] auth, String[] chat, String chatID) {
        this.auth = auth;
        this.chat = chat;
        this.chatID = chatID;
    }

    public String getChatID() {
        return chatID;
    }

    public Auth[] getAuth() {
        return auth;
    }

    public String[] getChat() {
        return chat;
    }

    public void setChat(String[] chat) {
        this.chat = chat;
    }

    public void setChatID(String chatID) {
        this.chatID = chatID;
    }

    public void setAuth(Auth[] auth) {
        this.auth = auth;
    }
}

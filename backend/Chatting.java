public class Chatting {
    //  다중접속
//    채팅방
//
    Auth auth;
    String chat;
    String chatID;
    GroupChat groupChat;

    Chatting(Auth auth, String chat, String chatID, GroupChat groupChat) {
        this.auth = auth;
        this.chat = chat;
        this.chatID = chatID;
        this.groupChat = groupChat;
    }

    public GroupChat getGroupChat() {
        return groupChat;
    }

    public Auth getAuth() {
        return auth;
    }

    public String getChat() {
        return chat;
    }

    public String getChatID() {
        return chatID;
    }

    public void setAuth(Auth auth) {
        this.auth = auth;
    }

    public void setChat(String chat) {
        this.chat = chat;
    }

    public void setChatID(String chatID) {
        this.chatID = chatID;
    }

    public void setGroupChat(GroupChat groupChat) {
        this.groupChat = groupChat;
    }
}

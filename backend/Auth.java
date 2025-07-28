public class Auth {
    //학생들이 로그인/회원가입
//        ID
//        PW
//        Email
//  회원가입 성공 이메일 발송/인증코드
//        PN
    private String ID;
    private String Password;
    private String Email;
    private String PhoneNumber;
    private String Name;
    Auth(String ID, String Password, String Email, String PhoneNumber, String Name) {
        this.ID = ID;
        this.Password = Password;
        this.Email = Email;
        this.PhoneNumber = PhoneNumber;
        this.Name = Name;
    }

    public String getName() {
        return Name;
    }

    public String getEmail() {
        return Email;
    }

    public String getID() {
        return ID;
    }

    public String getPassword() {
        return Password;
    }

    public String getPhoneNumber() {
        return PhoneNumber;
    }

    public void setEmail(String email) {
        Email = email;
    }

    public void setID(String ID) {
        this.ID = ID;
    }

    public void setName(String name) {
        Name = name;
    }

    public void setPassword(String password) {
        Password = password;
    }

    public void setPhoneNumber(String phoneNumber) {
        PhoneNumber = phoneNumber;
    }
    void signUp( String ID, String Password, String Email, String PhoneNumber, String Name) {
        //DB 에 저장
        //Email 발송
        //(sendEmail()에 email 을 넘기는 방식으로 코딩)
    }
    boolean signIn(String ID, String PW) {
        if (ID.equals(getID())&&PW.equals(getPassword())) {
            return true;
        } else {
            return false;
        }
    }
}

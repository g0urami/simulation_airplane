public class Group {
    //  레더보드
//     퀴즈
//
    String[] rankings;
    Auth[] auths;
    String rankID;

    Group(String[] rankings, Auth[] auths, String rankID) {
        this.rankings = rankings;
        this.auths = auths;
        this.rankID = rankID;
    }

    public Auth[] getAuths() {
        return auths;
    }

    public String getRankID() {
        return rankID;
    }

    public String[] getRankings() {
        return rankings;
    }

    public void setAuths(Auth[] auths) {
        this.auths = auths;
    }

    public void setRankID(String rankID) {
        this.rankID = rankID;
    }

    public void setRankings(String[] rankings) {
        this.rankings = rankings;
    }
}

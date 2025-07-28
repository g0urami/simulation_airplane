public class Weather {
    //날씨
//  특정 나라의 위치
//  특정 나라에 있는 도시들
//  특정 나라들의 시간
//
    double longitude;
    double latitude;
    String country;
    String city;
    String time;
    double temperature;
    String condition;

    Weather(double longitude, double latitude, String country, String city, String time, double temperature, String condition) {
        this.longitude = longitude;
        this.latitude = latitude;
        this.country = country;
        this.city = city;
        this.time = time;
        this.temperature = temperature;
        this.condition = condition;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public double getTemperature() {
        return temperature;
    }

    public String getCondition() {
        return condition;
    }

    public String getCity() {
        return city;
    }

    public String getCountry() {
        return country;
    }

    public String getTime() {
        return time;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }

    public void setTime(String time) {
        this.time = time;
    }
}

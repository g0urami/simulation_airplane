public class Simulation {
    //비행 시뮬레이션에서 반영 할 값들. (어떤 물리학 개념을 공부하게 할건지)(예를 들어 베르누이 면 무슨무슨 정보가 반영되어야한다)
//  기압
//  비행기의 정보
//  풍속
//  고도
//  속도
//
//
    double pressure;
    Plane plane;
    double airVelocity;
    double height;
    double velocity;
    Simulation(double pressure, Plane plane, double airVelocity, double height, double velocity) {
        this.pressure = pressure;
        this.plane = plane;
        this.airVelocity = airVelocity;
        this.height = height;
        this.velocity = velocity;
    }

    public double getAirVelocity() {
        return airVelocity;
    }

    public double getHeight() {
        return height;
    }

    public double getPressure() {
        return pressure;
    }

    public double getVelocity() {
        return velocity;
    }

    public Plane getPlane() {
        return plane;
    }

    public void setAirVelocity(double airVelocity) {
        this.airVelocity = airVelocity;
    }

    public void setHeight(double height) {
        this.height = height;
    }

    public void setPlane(Plane plane) {
        this.plane = plane;
    }

    public void setPressure(double pressure) {
        this.pressure = pressure;
    }

    public void setVelocity(double velocity) {
        this.velocity = velocity;
    }
}

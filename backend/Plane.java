public class Plane {
    //비행기의 종류
//      모델
//      크기
//      부품
//      재료
    String model;
    double size;
    String[] parts;
    String[] materials;
    double weight;
    Plane(String model, double size, String[] parts, String[] materials, double weight) {
        this.model = model;
        this.size = size;
        this.parts = parts;
        this.materials = materials;
        this.weight = weight;
    }

    public double getSize() {
        return size;
    }

    public double getWeight() {
        return weight;
    }

    public String getModel() {
        return model;
    }

    public String[] getMaterials() {
        return materials;
    }

    public String[] getParts() {
        return parts;
    }

    public void setMaterials(String[] materials) {
        this.materials = materials;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public void setParts(String[] parts) {
        this.parts = parts;
    }

    public void setSize(double size) {
        this.size = size;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }
}

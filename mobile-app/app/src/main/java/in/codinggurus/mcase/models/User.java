package in.codinggurus.mcase.models;

public class User {
    private String id;
    private String email;
    private String name;
    private String role;
    private String department;
    private String ward_id;
    private String zone;
    private String phone;
    private boolean active;

    public User() {}

    public User(String id, String email, String name, String role) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.role = role;
        this.active = true;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getWard_id() { return ward_id; }
    public void setWard_id(String ward_id) { this.ward_id = ward_id; }

    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}

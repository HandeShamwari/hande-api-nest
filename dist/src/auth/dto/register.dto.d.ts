export declare enum UserType {
    ADMIN = "admin",
    DRIVER = "driver",
    RIDER = "rider"
}
export declare class RegisterDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    userType: UserType;
}

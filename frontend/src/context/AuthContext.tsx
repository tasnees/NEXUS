import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'recruiter' | 'hiring_manager' | 'interviewer' | 'hr_admin' | null;

interface AuthContextType {
    role: UserRole;
    login: (selectedRole: UserRole) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<UserRole>(null);

    useEffect(() => {
        const storedRole = localStorage.getItem('user_role') as UserRole;
        if (storedRole) {
            setRole(storedRole);
        }
    }, []);

    const login = (selectedRole: UserRole) => {
        if (selectedRole) {
            localStorage.setItem('user_role', selectedRole);
            setRole(selectedRole);
        }
    };

    const logout = () => {
        localStorage.removeItem('user_role');
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ role, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

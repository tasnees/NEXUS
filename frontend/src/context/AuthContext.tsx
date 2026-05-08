import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'ta' | 'hm' | 'rl' | 'hp' | 'other' | 'recruiter' | 'hiring_manager' | 'interviewer' | 'hr_admin' | null;

interface User {
    user_id: number;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    role: UserRole;
    token: string | null;
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<UserRole>(null);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user_data');
        
        if (storedToken && storedUser) {
            const userData = JSON.parse(storedUser);
            setToken(storedToken);
            setUser(userData);
            setRole(userData.role as UserRole);
        }
    }, []);

    const login = (newToken: string, userData: User) => {
        localStorage.setItem('access_token', newToken);
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('user_role', userData.role);
        
        setToken(newToken);
        setUser(userData);
        setRole(userData.role as UserRole);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_role');
        
        setToken(null);
        setUser(null);
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ 
            role, 
            token, 
            user, 
            login, 
            logout, 
            isAuthenticated: !!token 
        }}>
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

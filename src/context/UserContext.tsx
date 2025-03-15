import React, { createContext, useState, useContext, useEffect } from 'react';

interface UserData {
    id?: string;
    email?: string;
    name?: string;
    // Add other user properties as needed
}

interface UserContextType {
    userData: UserData | null;
    updateUserData: (data: UserData | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userData, setUserData] = useState<UserData | null>(null);

    useEffect(() => {
        // Initialize user data from localStorage
        const storedData = localStorage.getItem('userData');
        if (storedData) {
            setUserData(JSON.parse(storedData));
        }
    }, []);

    const updateUserData = (newData: UserData | null) => {
        // Update both state and localStorage
        setUserData(newData);
        localStorage.setItem('userData', JSON.stringify(newData));
    };

    return (
        <UserContext.Provider value={{ userData, updateUserData }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

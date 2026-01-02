import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import axios from "axios";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState([]);

    const { socket } = useContext(AuthContext);

    // function to get all users for sidbar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
            }
        } catch (error) {
            toast.error(error.message)
        }

        // function to get messasges for selected user
        const getMessages = async (userId) => {
            try {
                const { data } = await axios.get(`/api/messages/${userId}`);
                if (data.success) {
                    setMessages(data.messages)
                }


            } catch (error) {
                toast.error(error.message)
            }
        }

        // fuction to send messages to selected user
        const sendMessages = async (messageData) => {
            try {
                const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData)
                if (data.success) {
                    setMessages((prevMessages) => [...prevMessages, data.newMessage])
                } else {
                    toast.error(error.message);
                }

            } catch (error) {
                toast.error(error.message);
            }
        }

        // function to subscibe to messages for selected user
        const subscribeToMessages = (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                // newMessageunSeen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`)

            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages, [newMessage.senderId]: prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1
                }))
            }
        }

        // function to unsubscribe from messasges
        const unsubscribeToMessages = () => {
            if (socket) socket.off("newMessage")
        }
        useEffect(() => {
          if(socket){
            socket.on("newMessage",subscribeToMessages());
          }
            return () => unsubscribeToMessages();
        }, [socket, selectedUser]);

    }
    const value = {
        messages, users, selectedUser, getUsers, setSelectedUser, unseenMessages
    };
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

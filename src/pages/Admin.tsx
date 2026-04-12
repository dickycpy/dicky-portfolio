import React, { useState, useEffect } from "react";
import { auth, storage, db } from "@/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Edit2, Trash2, Plus, X, Layout, FileText, Settings, Image as ImageIcon, Save, LogOut, ExternalLink, Shield } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  role: string;
  timeline: string;
  tools: string[];
  introduction?: string;
  challenge?: string;
  approach?: string;
  understanding?: string;
  define?: string;
  developDeliver?: string;
  reflection?: string;
  password?: string;
  createdAt: any;
}

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list',
  'link'
];

export default function Admin() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "content" | "settings">("general");

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Artificial Intelligence",
    role: "",
    timeline: "",
    tools: "",
    imageUrl: "",
    password: "",
    introduction: "",
    challenge: "",
    approach: "",
    understanding: "",
    define: "",
    developDeliver: "",
    reflection: ""
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => setUser(u));
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribeProjects = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[]);
    }, (err) => {
      console.error("Firestore error in Admin:", err);
    });
    return () => {
      unsubscribeAuth();
      unsubscribeProjects();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-white">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-4">Admin Access</h1>
          <button onClick={handleLogin} className="px-8 py-4 bg-black text-white rounded-xl font-bold">
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto min-h-screen bg-white">
      <div className="bg-red-500 text-white p-4 mb-8 rounded-xl font-bold text-center">
        ADMIN PANEL LOADED - DEBUG VERSION
      </div>
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <button onClick={() => signOut(auth)} className="text-neutral-400 hover:text-black">Logout</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map(p => (
          <div key={p.id} className="p-6 border border-neutral-100 rounded-3xl">
            <h3 className="font-bold text-xl mb-2">{p.title}</h3>
            <p className="text-neutral-500 text-sm">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

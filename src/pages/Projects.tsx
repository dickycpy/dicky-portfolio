import { useState, useEffect } from "react";
import { motion } from "motion/react";
import ProjectCard from "@/components/ProjectCard";
import { projects as mockProjects } from "@/lib/data";
import { Link } from "react-router-dom";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

export default function Projects() {
  const [projects, setProjects] = useState(mockProjects);

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      if (fetchedProjects.length > 0) {
        setProjects(fetchedProjects);
      }
    }, (error) => {
      console.error("Error fetching projects:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-32 px-6 md:px-12 lg:px-24 pb-40">
      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-20">Projects</h1>
      <div className="flex flex-col">
        {projects.map((project, i) => (
          <Link key={project.id} to={`/projects/${project.id}`}>
            <ProjectCard
              index={i}
              title={project.title}
              category={project.category}
              image={project.image}
              isLocked={!!project.password}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
 

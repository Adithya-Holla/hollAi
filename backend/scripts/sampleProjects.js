/**
 * This script adds sample project data to the database
 * Run it using: node scripts/sampleProjects.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Project = require('../models/Project');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Sample project data
const projects = [
  {
    title: 'Brain Tumor Detection',
    description: 'An AI-powered system that can detect and classify brain tumors from MRI scans with high accuracy using YOLOv7 architecture. The system was trained on a dataset of over 5,000 MRI images and achieved 94% accuracy in clinical trials.',
    imageUrl: 'https://i.imgur.com/XgbZdeA.jpg',
    technologies: ['Python', 'TensorFlow', 'YOLOv7', 'OpenCV', 'Flask'],
    githubUrl: 'https://github.com/Adithya-Holla/brain-tumor-detection',
    liveUrl: 'https://brain-tumor-detect.netlify.app',
    featured: true
  },
  {
    title: 'Portfolio Website',
    description: 'My personal portfolio website built with the MERN stack (MongoDB, Express, React, Node.js). Features a responsive design, dark/light mode, and integrates with MongoDB to dynamically display projects and certifications.',
    imageUrl: 'https://i.imgur.com/JR7WgtS.jpg',
    technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'CSS'],
    githubUrl: 'https://github.com/Adithya-Holla/portfolio',
    liveUrl: 'https://adithyaholla.com',
    featured: true
  },
  {
    title: 'E-commerce Platform',
    description: 'A full-featured e-commerce platform with user authentication, product catalog, shopping cart, and payment processing using Stripe. Includes an admin dashboard for managing products and orders.',
    imageUrl: 'https://i.imgur.com/gUyRfxN.jpg',
    technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Stripe API'],
    githubUrl: 'https://github.com/Adithya-Holla/mern-shop',
    liveUrl: 'https://mern-shop-demo.herokuapp.com',
    featured: false
  },
  {
    title: 'Weather App',
    description: 'A responsive weather application that provides current weather data and forecasts for locations worldwide. Integrates with the OpenWeatherMap API and features a clean, intuitive user interface.',
    imageUrl: 'https://i.imgur.com/cILcHn3.jpg',
    technologies: ['JavaScript', 'HTML', 'CSS', 'OpenWeatherMap API'],
    githubUrl: 'https://github.com/Adithya-Holla/weather-app',
    liveUrl: 'https://adithya-weather-app.netlify.app',
    featured: false
  },
  {
    title: 'Task Manager API',
    description: 'A RESTful API for task management built with Node.js and Express. Features include user authentication, task creation, updates, filtering, and pagination. Includes comprehensive testing with Jest.',
    imageUrl: 'https://i.imgur.com/2RMVGB2.jpg',
    technologies: ['Node.js', 'Express', 'MongoDB', 'JWT', 'Jest'],
    githubUrl: 'https://github.com/Adithya-Holla/task-manager-api',
    liveUrl: null,
    featured: false
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  
  try {
    // Get database reference
    const db = mongoose.connection.db;
    
    // List all collections before
    console.log('Collections before operation:');
    const collectionsBefore = await db.listCollections().toArray();
    collectionsBefore.forEach(coll => console.log(`- ${coll.name}`));
    
    // Drop projects collection if it exists
    try {
      await db.dropCollection('projects');
      console.log('Dropped existing projects collection');
    } catch (err) {
      console.log('No existing projects collection to drop');
    }
    
    // Explicitly create the projects collection
    await db.createCollection('projects');
    console.log('Created projects collection');
    
    // Insert the project data
    const result = await db.collection('projects').insertMany(projects);
    console.log(`Added ${result.insertedCount} sample projects to the database`);
    
    // List the added projects
    projects.forEach((project, index) => {
      console.log(`- ${project.title} (Featured: ${project.featured})`);
    });
    
    // List all collections after
    console.log('Collections after operation:');
    const collectionsAfter = await db.listCollections().toArray();
    collectionsAfter.forEach(coll => console.log(`- ${coll.name}`));
    
    // Close the connection
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
}); 
/**
 * This script explicitly creates a projects collection and adds sample data
 * Run it using: node scripts/createProjects.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const projects = [
  {
  title: 'Code Complexity Analyzer',
  description: 'Contributed to an open-source Chrome extension that analyzes LeetCode code using AI by debugging and fixing critical Manifest V3 issues. Resolved CORS-related API failures by migrating requests to a service worker, implemented robust message passing, added defensive error handling and request timeouts, and updated deprecated model references to restore stable extension functionality.',
  technologies: ['JavaScript','Chrome Extensions','Manifest V3','Service Workers','REST API','CORS','AbortController','GitHub','Open Source'],
  imageUrl: 'https://www.dropbox.com/scl/fi/2fc60jyc4zuk156scl0of/CodeComplexityAnalyzer.jpg?rlkey=putvnu5bv2yixnqomh8yuzkgn&st=0iy8rxl6&raw=1',
  githubUrl: 'https://github.com/Adithya-Holla/CodeComplexityAnalyzer',
  liveUrl: 'https://chromewebstore.google.com/detail/leetcode-complexity-analy/jpiolmonibjmefeflkkebcjeaggcjkio',
  featured: false
},
  {
  title: 'HealthChain',
  description: 'HealthChain is a blockchain-based healthcare data management platform that enables patients to securely control access to their medical records using Ethereum smart contracts. Doctors can create and manage records with patient consent, while medical files are stored on IPFS with an immutable on-chain audit trail for transparency and security.',
  technologies: ['React','Vite','Tailwind CSS','Solidity','Hardhat','Ethereum','Sepolia Testnet','ethers.js','IPFS','Pinata','MetaMask'],
  imageUrl: 'https://www.dropbox.com/scl/fi/drdhcwjyd3jdehn6x7em9/HealthChain.jpg?rlkey=4mco8wulo7gif2krihegrv7sw&st=hpu6y82n&raw=1',
  githubUrl: 'https://github.com/Adithya-Holla/Healthchain',
  liveUrl: 'https://healthchain-eight.vercel.app',
  featured: true
  },
  {
    title: 'Post',
    description: 'Post is a full-stack microblogging platform where users can create posts, explore a live feed, and interact with content in a clean and responsive UI. It includes secure authentication, user profiles, and real-time-like post updates powered by a scalable backend and database.',
    technologies: ['React','Node.js','Express.js','MongoDB','JWT Authentication','REST API','Axios','Tailwind CSS'],
    imageUrl: 'https://www.dropbox.com/scl/fi/kl02mxfjz3fijfpr4q82i/PostImage.png?rlkey=png502x3v68dktr0s4xpk5rg0&st=cgrnrow9&raw=1',
    githubUrl: 'https://github.com/Adithya-Holla/Post',
    liveUrl: 'https://post-3jb3.onrender.com/',
    featured: false
  },
  {
    title: 'Distributed Kafka Messaging System',
    description: 'A distributed producer–consumer messaging system with centralized administration and access control.',
    technologies: ['Apache Kafka','Apache Zookeeper','Python'],
    imageUrl: 'https://www.dropbox.com/scl/fi/54rzw2eq3t8jr7z9h6uki/DistributedMessagingImage.png?rlkey=fpp6n8ce9862u192cpgjpsq6n&st=kfr9b8xi&raw=1',
    githubUrl: 'https://github.com/Adithya-Holla/109_Project2_BD',
    liveUrl: null,
    featured: false
  },
  {
    title: 'Diabetes prediction using SVC',
    description: 'An advanced machine learning system that predicts diabetes risk using Support Vector Machine algorithms. Features comprehensive data preprocessing, feature engineering, and real-time prediction capabilities with 77.2% accuracy.',
    technologies: ['SVC', 'Scikit-learn', 'Pandas', 'Numpy', 'Machine Learning','Data Science'],
    imageUrl: 'https://media.istockphoto.com/id/491965869/photo/woman-doing-blood-sugar-test.jpg?s=1024x1024&w=is&k=20&c=rNnxL5Di0ZdY0y0M1FTkmpsRUTwI4WhgCZ2_UEq1q2g=',
    githubUrl: 'https://github.com/Adithya-Holla/Projects/tree/main/Diabetes_prediction_using_SVM',
    liveUrl: null,
    featured: false
  },
  {
    title: 'Smart News Authenticity Detector',
    description: 'A sophisticated NLP-based system that identifies fake news using Logistic Regression and advanced text processing. Implements TF-IDF vectorization, sentiment analysis, and real time fact checking capabilities with 98.9% accuracy.',
    technologies: ['NLTK', 'Scikit-learn', 'NLP', 'Machine Learning', 'Logistic Regression'],
    imageUrl: 'https://images.unsplash.com/photo-1709285672636-181f824f52bd?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    githubUrl: 'https://github.com/Adithya-Holla/Projects/tree/main/Fake_news_prediction_using_LogisticRegression',
    liveUrl: null,
    featured: false
  },
  {
    title: 'Sonar Object Classification Engine',
    description: 'A robust classification system that distinguishes between rocks and mines using sonar signal analysis. Implements advanced signal processing techniques and SVM algorithms for high-precision underwater object detection with 95% accuracy.',
    technologies: ['SVM', 'Data Science', 'Machine Learning'],
    imageUrl: 'https://media.istockphoto.com/id/1140161420/photo/submarine-dives-under-the-ice.jpg?s=1024x1024&w=is&k=20&c=W_XsDnn5nHL0VRwPtVihZ_bVFtTMuEzmlwDckRJy7o4=',
    githubUrl: 'https://github.com/Adithya-Holla/Projects/tree/main/Rock_vs_Mine_Prediction',
    liveUrl: null,
    featured: false
  }
];

// Log the MongoDB URI for debugging
console.log('MongoDB URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'URI is missing');

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

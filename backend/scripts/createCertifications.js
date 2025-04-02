/**
 * This script explicitly creates a certifications collection and adds sample data
 * Run it using: node scripts/createCertifications.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Sample certification data
const certifications = [
  {
    title: 'AWS Certified Solutions Architect - Associate',
    organization: 'Amazon Web Services',
    issueDate: new Date('2022-03-15'),
    expiryDate: new Date('2025-03-15'),
    credentialID: 'AWS-ASA-123456',
    credentialURL: 'https://www.credly.com/badges/aws-certified-solutions-architect-associate',
    description: 'Validates the ability to design and implement systems on AWS that are highly available, cost-efficient, and scalable.',
    skills: ['AWS', 'Cloud Architecture', 'EC2', 'S3', 'Lambda', 'DynamoDB'],
    imageUrl: 'https://images.credly.com/size/340x340/images/0e284c3f-5164-4b21-8660-0d84737941bc/image.png',
    featured: true
  },
  {
    title: 'Microsoft Certified: Azure Developer Associate',
    organization: 'Microsoft',
    issueDate: new Date('2022-01-10'),
    expiryDate: new Date('2024-01-10'),
    credentialID: 'MS-AZ-204-789123',
    credentialURL: 'https://www.credly.com/badges/microsoft-certified-azure-developer-associate',
    description: 'Validates expertise in designing, building, testing, and maintaining cloud applications and services on Microsoft Azure.',
    skills: ['Azure', 'Cloud Development', 'Azure Functions', 'Azure Storage', 'Azure App Service'],
    imageUrl: 'https://images.credly.com/size/340x340/images/63316b60-f62d-4e51-aacc-c23cb850089c/azure-developer-associate-600x600.png',
    featured: true
  },
  {
    title: 'MongoDB Certified Developer Associate',
    organization: 'MongoDB',
    issueDate: new Date('2021-11-05'),
    credentialID: 'MDB-DEV-123456',
    credentialURL: 'https://university.mongodb.com/certification/developer/about',
    description: 'Validates skills in developing applications using MongoDB, including data modeling, CRUD operations, indexing, and aggregation.',
    skills: ['MongoDB', 'NoSQL', 'Database Design', 'Aggregation Framework'],
    imageUrl: 'https://university.mongodb.com/images/heroimages/mongodb-u-certification-dev.png',
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
    
    // Drop certifications collection if it exists
    try {
      await db.dropCollection('certifications');
      console.log('Dropped existing certifications collection');
    } catch (err) {
      console.log('No existing certifications collection to drop');
    }
    
    // Explicitly create the certifications collection
    await db.createCollection('certifications');
    console.log('Created certifications collection');
    
    // Insert the certification data
    const result = await db.collection('certifications').insertMany(certifications);
    console.log(`Added ${result.insertedCount} sample certifications to the database`);
    
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
/**
 * This script adds sample certification data to the database
 * Run it using: node scripts/sampleCertifications.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Certification = require('../models/Certification');

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

// Log environment for debugging
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI is set' : 'URI is missing');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected successfully');
  
  try {
    // Delete existing certifications
    await Certification.deleteMany({});
    console.log('Cleared existing certifications');
    
    // Add new certifications
    const result = await Certification.insertMany(certifications);
    console.log(`Added ${result.length} sample certifications to the database`);
    
    // List the added certifications
    result.forEach(cert => {
      console.log(`- ${cert.title} (${cert._id})`);
    });
    
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error adding sample certifications:', error);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
}); 
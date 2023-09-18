const readline = require('readline');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const Student = require('./student');
const studentList = [];

const uri = "mongodb+srv://stephentotten:AngryCuddle5!@cluster0.sneignz.mongodb.net/?retryWrites=true&w=majority";
const dbName = "student_management_db"; // Replace with your database name
const collectionName = "students"; // Replace with your collection name

async function run() {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    await client.close();
  }
}

async function connectToDatabase() {
    const client = new MongoClient(uri, { useUnifiedTopology: true });
    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection(collectionName);
      console.log('Connected to the database:', dbName, collectionName); // Debug statement
      return { client, db, collection };
    } catch (err) {
      console.error('Error connecting to MongoDB: ' + err.message);
      process.exit(1);
    }
  }
async function askQuestion(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}
async function main() {
  console.log('Welcome to Student Management System');
  const { client, db, collection } = await connectToDatabase();

  try {
    await loadStudentsFromDatabase(collection);
    await promptUser(collection);
  } finally {
    client.close();
  }
}

async function promptUser(collection) {
    console.log('Press the option number to perform the action');
    console.log('1. Add student');
    console.log('2. Delete student');
    console.log('3. Update student');
    console.log('4. Search student');
    console.log('5. Print all students');
    console.log('6. Exit');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const choice = await askQuestion(rl, 'Enter your choice: ');

    switch (parseInt(choice)) {
        case 1:
            // Add student
            const name = await askQuestion(rl, 'Enter student name: ');
            const age = parseInt(await askQuestion(rl, 'Enter student age: '));
            await addStudent(name, age, collection); // Call the addStudent function with the collection
            rl.close(); // Close readline interface
            break;

        case 2:
            // Delete student
            const deleteName = await askQuestion(rl, 'Enter student name to delete: ');
            deleteStudent(studentList, deleteName);
            rl.close(); // Close readline interface
            break;

        case 3:
            // Update student
            const oldName = await askQuestion(rl, 'Enter student name to update: ');
            const newName = await askQuestion(rl, 'Enter new name: ');
            const newAge = parseInt(await askQuestion(rl, 'Enter new age: '));
            updateStudent(studentList, oldName, newName, newAge);
            rl.close(); // Close readline interface
            break;

        case 4:
            // Search student by name or ID
            console.log('Search by:');
            console.log('1. Name');
            console.log('2. ID');
            const searchOption = await askQuestion(rl, 'Enter your choice: ');

            switch (parseInt(searchOption)) {
                case 1:
                    // Search by name
                    const searchName = await askQuestion(rl, 'Enter student name to search: ');
                    searchStudentByName(studentList, searchName);
                    break;

                case 2:
                    // Search by ID
                    const searchID = parseInt(await askQuestion(rl, 'Enter student ID to search: '));
                    searchStudentByID(studentList, searchID);
                    break;

                default:
                    console.log('Invalid search option. Please try again.');
                    break;
            }
            rl.close(); // Close readline interface
            break;

        case 5:
            // Print all students
            printStudents(studentList);
            rl.close(); // Close readline interface
            break;

        case 6:
            // Exit and save to file
            //await saveStudentsToDatabase();
            console.log('Exiting...');
            rl.close(); // Close readline interface
            process.exit();
            break;

        default:
            console.log('Invalid choice. Please try again.');
            rl.close(); // Close readline interface
            break;
    }

    // Call promptUser again to continue the interaction
    await promptUser(collection);

    // Close readline interface outside the switch
    rl.close();
}


async function loadStudentsFromDatabase(collection) {
  try {
    studentList.length = 0;
    const students = await collection.find({}).toArray();
    students.forEach((student) => {
      const { id, name, age } = student;
      const studentObject = new Student(name, age, id);
      studentList.push(studentObject);
    });
  } catch (err) {
    console.error('Error loading students from database: ' + err.message);
  }
}

async function addStudent(name, age, collection) {
    try {
      const result = await collection.insertOne({ name, age });
      const newStudent = new Student(name, age, result.insertedId); // Capture the auto-generated ID
  
      // Only push the student into the array after a successful database insertion
      studentList.push(newStudent);
  
      console.log('Student added to database with ID: ' + result.insertedId);
    } catch (err) {
      console.error('Error adding student to database: ' + err.message);
    }
}

  
async function updateStudent(collection, oldName, newName, newAge) {
    try {
        const result = await collection.updateOne(
            { name: oldName },
            {
                $set: {
                    name: newName,
                    age: newAge,
                },
            }
        );

        if (result.modifiedCount === 1) {
            // Check if one document was modified
            console.log('Student updated in database.');
            // Update the local studentList if needed
            const updatedStudent = studentList.find(student => student.name === oldName);
            if (updatedStudent) {
                updatedStudent.name = newName;
                updatedStudent.age = newAge;
            }
        } else {
            console.log('Student not found or no changes made.');
        }
    } catch (err) {
        console.error('Error updating student in database: ' + err.message);
    }
}

async function deleteStudent(deleteName, collection) {
    try {
      const result = await collection.deleteOne({ name: deleteName });
  
      if (result.deletedCount === 1) {
        // Check if one document was deleted
        console.log('Student deleted from database.');
        // Remove the student from the local studentList if needed
        const deletedStudentIndex = studentList.findIndex(student => student.name === deleteName);
        if (deletedStudentIndex !== -1) {
          studentList.splice(deletedStudentIndex, 1);
        }
      } else {
        console.log('Student not found in the database.');
      }
    } catch (err) {
      console.error('Error deleting student from database: ' + err.message);
    }
  }
  

function printStudents(studentList) {
    for (const student of studentList) {
        console.log(`Name: ${student.name} // Age: ${student.age} // ID: ${student.id}`);
    }
}

function searchStudentByID(studentList, id) {
    const foundStudent = studentList.find(student => student.id === id);
    if (foundStudent) {
        console.log(`Student found: ${foundStudent.name} // Age: ${foundStudent.age}`);
    } else {
        console.log('Student not found');
    }
}

function searchStudentByName(studentList, name) {
    const foundStudent = studentList.find(student => student.name === name);
    if (foundStudent) {
        console.log(`Student found: ${foundStudent.name}, Age: ${foundStudent.age}, ID: ${foundStudent.id}`);
    } else {
        console.log('Student not found');
    }
}

process.on('SIGINT', () => {
  // Close the MongoDB connection on program exit
  console.log('Exiting...');
  process.exit();
});

run().catch(console.dir);
main();

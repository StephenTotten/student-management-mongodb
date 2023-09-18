const readline = require('readline');
const { MongoClient, ObjectId } = require('mongodb');
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
            addStudent(name, age);
            rl.close();
            await promptUser();
            break;

        case 2:
            // Delete student
            const deleteName = await askQuestion(rl, 'Enter student name to delete: ');
            deleteStudent(studentList, deleteName);
            rl.close();
            await promptUser();
            break;

        case 3:
            // Update student
            const oldName = await askQuestion(rl, 'Enter student name to update: ');
            const newName = await askQuestion(rl, 'Enter new name: ');
            const newAge = parseInt(await askQuestion(rl, 'Enter new age: '));
            updateStudent(studentList, oldName, newName, newAge);
            rl.close();
            await promptUser();
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
                    rl.close();
                    await promptUser();
                    break;

                case 2:
                    // Search by ID
                    const searchID = parseInt(await askQuestion(rl, 'Enter student ID to search: '));
                    searchStudentByID(studentList, searchID);
                    rl.close();
                    await promptUser();
                    break;

                default:
                    console.log('Invalid search option. Please try again.');
                    rl.close();
                    await promptUser();
                    break;
            }
            break;

        case 5:
            // Print all students
            printStudents(studentList);
            rl.close();
            await promptUser();
            break;

        case 6:
            // Exit and save to file
            //await saveStudentsToDatabase();
            console.log('Exiting...');
            rl.close();
            process.exit();

        default:
            console.log('Invalid choice. Please try again.');
            rl.close();
            await promptUser();
            break;
    }
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

function addStudent(name, age) {
    const query = 'INSERT INTO student (name, age) VALUES (?, ?)';
    connection.query(query, [name, age], (err, result) => {
      if (err) {
        console.error('Error adding student to database: ' + err.message);
        return;
      }
  
      const newStudent = new Student(name, age, result.insertId); // Capture the auto-generated ID
  
      // Only push the student into the array after a successful database insertion
      studentList.push(newStudent);
  
      console.log('Student added to database with ID: ' + result.insertId);
    });
  }
  
  async function updateStudent(studentList, oldName, newName, newAge) {
    const query = 'UPDATE student SET name = ?, age = ? WHERE name = ?';
    connection.query(query, [newName, newAge, oldName], (err, result) => {
      if (err) {
        console.error('Error updating student in database: ' + err.message);
        return;
      }
  
      // Update the local studentList only if the database update succeeds
      for (const student of studentList) {
        if (student.name === oldName) {
          student.name = newName;
          student.age = newAge;
          break;
        }
      }
  
      console.log('Student updated in database.');
    });
  }
  
  function deleteStudent(studentList, deleteName) {
    const query = 'DELETE FROM student WHERE name = ?';
    connection.query(query, [deleteName], (err, result) => {
      if (err) {
        console.error('Error deleting student from database: ' + err.message);
        return;
      }
  
      if (result.affectedRows === 0) {
        console.log('Student not found');
        return;
      }
  
      // Update the local studentList only if the database delete operation succeeds
      const updatedStudentList = studentList.filter(student => student.name !== deleteName);
      studentList.length = 0; // Clear the existing studentList
      Array.prototype.push.apply(studentList, updatedStudentList); // Copy the updated list back
  
      console.log('Student deleted from database.');
    });
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

async function saveStudentsToDatabase() {
  try {
    const values = studentList.map((student) => [student.name, student.age]);
    const query = 'INSERT INTO student (name, age) VALUES ?';
    connection.query(query, [values], (err) => {
      if (err) {
        console.error('Error saving students to database: ' + err.message);
        return;
      }
      console.log('Changes saved to database');
    });
  } catch (err) {
    console.error('Error saving students to database: ' + err.message);
  }
}

process.on('SIGINT', () => {
  // Close the MongoDB connection on program exit
  console.log('Exiting...');
  process.exit();
});

run().catch(console.dir);
main();

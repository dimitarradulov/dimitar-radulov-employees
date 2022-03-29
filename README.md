## Sirma Solutions Employee Task

Application that identifies the pair of employees who have worked together on common projects for the longest period of time from an csv file.

![EmployeePairs In Action](./img/employeepairs-use.gif)

## Solution Formulation

Steps I thought of and executed for solving the task:

1. A way to parse the .csv file - using a library called Papa Parse
2. A way to handle dates more easily - using moment.js library
3. Create a function that will handle the parsed data
4. Added submit event listener to the form
   - Get the input and store it in a variable
   - Check if the file format is valid
   - Check if all the fields are correct and valid
   - Used Papa parse to parse the input
   - Store the result from the function that handles the parsed data into a variable
   - Display the data into a table using the DOM

## Technologies and Libraries

- HTML
- CSS
- JavaScript
  - Papa Parse 5.0
  - Moment 2.29.1
  - Parcel 2.3.2

## How to Setup

Run the following commands to setup, given node and npm is available:

1. Clone the repo:

```
git clone https://github.com/dimitarradulov/dimitar-radulov-employees.git
```

2. Cd to the directory

```
cd dimitar-radulov-employees
```

3. Install dependencies

```
npm install
```

4. Run the app

```
npm start
```

## Quick Preview

You can check out the app here:
<a href="https://dimitar-radulov-employees.netlify.app" target="_blank">EmployeePairs - Sirma Task</a>

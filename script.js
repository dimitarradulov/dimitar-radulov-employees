import 'core-js/stable';
import Papa from 'papaparse';
import moment from 'moment';

// ****** Elements ******
const csvForm = document.querySelector('.upload-csv');
const csvFile = document.querySelector('#csvFile');
const csvTable = document.querySelector('.csv-table');
const csvTableBody = csvTable.querySelector('.csv-table__body');
const errorBox = document.querySelector('.error');

// ****** Functions ******
// Inititialize moment.js
moment().format();

const clearErrorMsg = () => (errorBox.textContent = '');

const hideTable = () => csvTable.classList.add('hidden');

const errorMsg = (msg) => {
  clearErrorMsg();
  hideTable();

  const markup = `
    <p>${msg}</p>
  `;

  errorBox.insertAdjacentHTML('beforeend', markup);
};

const differenceInDaysBetweenDates = (date1, date2) => {
  const divider = 24 * 60 * 60 * 1000;
  return Math.floor((date2 - date1) / divider);
};

const parseToDate = (date) => {
  return date.toLowerCase() === 'null' ? new Date() : new Date(date);
};

const validCsvDataFields = (csvData) => {
  const {
    meta: { fields },
  } = csvData;

  // 1) Check if all fields are present
  if (fields.length < 4) return false;

  // 2) Check if all fields are the correct ones
  const dataFields = ['EmpID', 'ProjectID', 'DateFrom', 'DateTo'];

  const isCorrectDataFields = fields.every(
    (field, i) => field === dataFields[i]
  );

  if (!isCorrectDataFields) return false;

  const { data } = csvData;

  // 3) Check if all the input fields are correctly formated
  const isInputFieldsCorrectFormat = data.every((input) => {
    // 3.1) Check if employee id and project id are numbers
    if (Number.isNaN(+input.EmpID) || Number.isNaN(+input.ProjectID))
      return false;

    // 3.2) Check if the datefrom is valid date format
    if (!moment(input.DateFrom, true).isValid()) return false;

    // 3.3) Check if dateto is valid date format or null
    if (
      !moment(input.DateTo, true).isValid() &&
      input.DateTo.toLowerCase() !== 'null'
    )
      return false;

    // 3.4) Check if the end date is not smaller than the beginning date
    if (moment(input.DateFrom) > moment(input.DateTo)) return false;

    // 3.5) If all checkes passed return true
    return true;
  });

  if (!isInputFieldsCorrectFormat) return false;

  // 4) If everything correct return true
  return true;
};

const pairWorkedTogether = (emp1, emp2) => {
  if (moment(emp1.DateFrom).isBetween(emp2.DateFrom, emp2.DateTo)) return true;

  if (moment(emp2.DateFrom).isBetween(emp1.DateFrom, emp1.DateTo)) return true;

  if (moment(emp1.DateFrom).isSame(emp2.DateFrom)) return true;

  return false;
};

const pairWorkedTheLongestTime = (csvData) => {
  const pairs = {};

  const { data } = csvData;

  // 1) Parse the dateFrom and dateTo input fields to real dates
  data.forEach((emp) => {
    emp.DateFrom = parseToDate(emp.DateFrom);
    emp.DateTo = parseToDate(emp.DateTo);
  });

  // 2) sort for easy pair access and add to new pair object if criteria met
  data
    .sort((a, b) => Number(a.ProjectID) - Number(b.ProjectID))
    .forEach((emp, i, arr) => {
      if (i === arr.length - 1) return;
      if (emp.ProjectID !== arr[i + 1].ProjectID) return;
      if (!pairWorkedTogether(emp, arr[i + 1])) return;

      pairs[`pairProjectID#${emp.ProjectID}`] = {
        pair: [emp, arr[i + 1]],
        daysWorkedTogether: 0,
      };
    });

  // 3) Check if pairs is not empty
  const pairsLength = Object.keys(pairs).length;

  if (pairsLength < 1) return null;

  // 4) Map to a new array with days worked calculations
  const calcDaysWorkedTogether = Object.values(pairs).map((employeePair) => {
    const { pair } = employeePair;
    const emp1 = pair[0];
    const emp2 = pair[1];

    let date1 = moment(emp1.DateFrom).isSame(emp2.DateFrom) ? emp1.DateFrom : 0;
    let date2 = moment(emp1.DateTo).isSame(emp2.DateTo) ? emp1.DateTo : 0;

    if (emp1.DateFrom < emp2.DateFrom) date1 = emp2.DateFrom;
    if (emp1.DateFrom > emp2.DateFrom) date1 = emp1.DateFrom;

    if (emp1.DateTo < emp2.DateTo) date2 = emp1.DateTo;
    if (emp1.DateTo > emp2.DateTo) date2 = emp2.DateTo;

    const daysWorked = differenceInDaysBetweenDates(date1, date2);

    return { daysWorked, pair };
  });

  // 5) Find the biggest daysworked and store it in a variable
  let biggestNum = 0;

  calcDaysWorkedTogether.forEach((pair) => {
    if (pair.daysWorked > biggestNum) biggestNum = pair.daysWorked;
  });

  /* Could be done with reduce
  const biggestDaysWorkedTogether = calcDaysWorkedTogether.reduce(
    (prevValue, currValue) => {
      if (prevValue.daysWorked > currValue.daysWorked)
        return prevValue.daysWorked;
      else return currValue.daysWorked;
    },
    0
  );
  */

  // 6) Find the object pair that has the biggest days worked based on the above
  const pairToDisplay = calcDaysWorkedTogether.find(
    (pair) => pair.daysWorked === biggestNum
  );

  return pairToDisplay;
};

// ****** Event Listeners ******
csvForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const input = csvFile.files[0];

  if (!input) return;

  // Check if valid file format
  const regex = /.+\.csv$/;

  if (!regex.test(input.name))
    return errorMsg('Invalid file! Please try again with a .csv file.');

  // Parse the input
  Papa.parse(input, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (res) {
      if (!validCsvDataFields(res))
        return errorMsg(
          'The data is not formatted correctly! Check for missing fields or invalid ones. ⛔'
        );

      const displayPair = pairWorkedTheLongestTime(res);

      if (csvTable.classList.contains('hidden'))
        csvTable.classList.remove('hidden');

      clearErrorMsg();
      csvTableBody.textContent = '';

      let markup;

      if (!displayPair) {
        markup = `
          <tr>
            <td colspan="4">No pair found!</td>
          </tr>
        `;
      }

      if (displayPair) {
        markup = `
          <tr>
            <td>${displayPair.pair[0].EmpID}</td>
            <td>${displayPair.pair[1].EmpID}</td>
            <td>${displayPair.pair[0].ProjectID}</td>
            <td>
              ${displayPair.daysWorked}
            </td>
          </tr>
        `;
      }

      csvTableBody.insertAdjacentHTML('afterbegin', markup);
    },
  });

  e.currentTarget.reset();
});

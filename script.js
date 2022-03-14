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
moment().format();

const clearErrorMsg = () => (errorBox.textContent = '');

const errorMsg = (msg) => {
  clearErrorMsg();

  const markup = `
    <p>${msg}</p>
  `;

  errorBox.insertAdjacentHTML('beforeend', markup);
};

const differenceInDaysBetweenDates = (date1, date2) => {
  const divider = 24 * 60 * 60 * 1000;
  return Math.floor((date2 - date1) / divider);
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
    if (!moment(input.DateFrom).isValid()) return false;

    // 3.3) Check if dateto is valid date format or null
    if (
      !moment(input.DateTo).isValid() &&
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

const pairWorkedTheLongestTime = (csvData) => {
  const pairs = {};

  const { data } = csvData;

  data
    .sort((a, b) => Number(a.ProjectID) - Number(b.ProjectID))
    .forEach((emp, i, arr) => {
      if (i === arr.length - 1) return;
      if (emp.ProjectID === arr[i + 1].ProjectID) {
        pairs[`pairProjectID#${emp.ProjectID}`] = {
          pair: [emp, arr[i + 1]],
          emp1DaysWorked: 0,
          emp2DaysWorked: 0,
          totalDaysWorked: 0,
        };
      }
    });

  const pairsLength = Object.keys(pairs).length;

  if (pairsLength < 1) return null;

  Object.keys(pairs).forEach((key) => {
    const employee1 = pairs[key].pair[0];
    const employee2 = pairs[key].pair[1];

    const employee1Date1 = new Date(employee1.DateFrom);
    const employee1Date2 =
      employee1.DateTo.toLowerCase() === 'null'
        ? new Date()
        : new Date(employee1.DateTo);

    const employee2Date1 = new Date(employee2.DateFrom);
    const employee2Date2 =
      employee2.DateTo.toLowerCase() === 'null'
        ? new Date()
        : new Date(employee2.DateTo);

    pairs[key].emp1DaysWorked = differenceInDaysBetweenDates(
      employee1Date1,
      employee1Date2
    );
    pairs[key].emp2DaysWorked = differenceInDaysBetweenDates(
      employee2Date1,
      employee2Date2
    );
    pairs[key].totalDaysWorked =
      pairs[key].emp1DaysWorked + pairs[key].emp2DaysWorked;
  });

  const pairToDisplay = Object.values(pairs)
    .sort((a, b) => b.totalDaysWorked - a.totalDaysWorked)
    .slice(0, 1)[0];

  return pairToDisplay;
};

// ****** Event Listeners ******
csvForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const input = csvFile.files[0];

  if (!input) return;

  // Check if valid format
  const regex = /.+\.csv$/;

  if (!regex.test(input.name))
    return errorMsg('Invalid file! Please try again with a .csv file.');

  // Parse the input
  Papa.parse(input, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (res) {
      console.log(res);

      if (!validCsvDataFields(res)) return errorMsg('Invalid data format!');

      const displayPair = pairWorkedTheLongestTime(res);

      if (csvTable.classList.contains('hidden'))
        csvTable.classList.remove('hidden');

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
              <em>Employee #1:</em> <span class="emp-1">${displayPair.emp1DaysWorked}</span>,
              <em>Employee #2:</em> <span class="emp-2">${displayPair.emp2DaysWorked}</span>,
              <em>Total:</em> <span class="total">${displayPair.totalDaysWorked}</span>
            </td>
          </tr>
        `;
      }

      csvTableBody.insertAdjacentHTML('afterbegin', markup);
    },
  });

  e.currentTarget.reset();
});

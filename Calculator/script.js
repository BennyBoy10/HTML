// Function to clear the result
function clearResult() {
    document.getElementById("result").value = "";
  }
  
  // Function to append a number to the result
  function appendNumber(number) {
    document.getElementById("result").value += number;
  }
  
  // Function to append an operator to the result
  function appendOperator(operator) {
    document.getElementById("result").value += operator;
  }
  
  // Function to calculate the result
  function calculate() {
    var result = eval(document.getElementById("result").value);
    document.getElementById("result").value = result;
  }

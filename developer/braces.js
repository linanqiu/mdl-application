var ALLOWEDBRACES = {
  '(': ')',
  '{': '}',
  '[': ']'
}

function validate(string) {
  var stack = [];

  for (var i = 0; i < string.length; i++) {
    if (ALLOWEDBRACES[string[i]]) {
      stack.push(string[i]);
    } else {
      var top = stack[stack.length - 1];
      if (string[i] == ALLOWEDBRACES[top]) {
        stack.pop();
      } else {
        return false;
      }
    }
  }

  return (stack.length == 0);
}

console.log(validate('[{}]'));
console.log(validate('[{(})]'));
console.log(validate('[(]'));

// for fun
console.log(validate('[[[[[[[[[[{{{{{{{{{{(((((((((({{{({({({({{{{(((({{{{{[[[[[[[[[[[[[[[(((((({({({({{{{((({{{(({{({({({({({({{{(([[[[[[[]]]]]]]))}}})})})})})})}}))}}})))}}}})})})}))))))]]]]]]]]]]]]]]]}}}}}))))}}}})})})})}}}))))))))))}}}}}}}}}}]]]]]]]]]]'));
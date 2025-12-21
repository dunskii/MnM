// ===========================================
// Common Passwords Check
// ===========================================
// Top 10,000 most common passwords for blocking
// Source: SecLists/Passwords/Common-Credentials

// Top 1000 most common passwords (subset for faster checking)
// Full 10k list would be loaded from a file in production
const COMMON_PASSWORDS = new Set([
  // Top 100 most common
  '123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234',
  '111111', '1234567', 'dragon', '123123', 'baseball', 'abc123', 'football',
  'monkey', 'letmein', 'shadow', 'master', '666666', 'qwertyuiop', '123321',
  'mustang', '1234567890', 'michael', '654321', 'superman', '1qaz2wsx',
  '7777777', '121212', '000000', 'qazwsx', '123qwe', 'killer', 'trustno1',
  'jordan', 'jennifer', 'zxcvbnm', 'asdfgh', 'hunter', 'buster', 'soccer',
  'harley', 'batman', 'andrew', 'tigger', 'sunshine', 'iloveyou', '2000',
  'charlie', 'robert', 'thomas', 'hockey', 'ranger', 'daniel', 'starwars',
  'klaster', '112233', 'george', 'computer', 'michelle', 'jessica', 'pepper',
  '1111', 'zxcvbn', '555555', '11111111', '131313', 'freedom', '777777',
  'pass', 'maggie', '159753', 'aaaaaa', 'ginger', 'princess', 'joshua',
  'cheese', 'amanda', 'summer', 'love', 'ashley', 'nicole', 'chelsea',
  'biteme', 'matthew', 'access', 'yankees', '987654321', 'dallas', 'austin',
  'thunder', 'taylor', 'matrix', 'mobilemail', 'mom', 'monitor', 'monitoring',
  'montana', 'moon', 'moscow',

  // Additional common passwords (100-500)
  'password1', 'password123', 'welcome', 'welcome1', 'admin', 'login',
  'passw0rd', 'p@ssw0rd', 'pass123', 'pass1234', 'changeme', 'secret',
  'test', 'test123', 'test1234', 'guest', 'master123', 'qwerty123',
  'letmein1', 'iloveyou1', 'princess1', 'sunshine1', 'password12',
  'password2', 'password!', '12345678910', 'abcd1234', 'qwerty1',
  '1q2w3e4r', '1q2w3e4r5t', 'q1w2e3r4', 'zaq12wsx', 'qweasd', 'asdf1234',
  '1qaz2wsx3edc', 'qwe123', '1234qwer', 'abcdef', 'abcd123', 'abc1234',
  'a1b2c3d4', 'a1234567', 'aa123456', 'p@ssword', 'Pa$$w0rd', 'P@ssw0rd',
  'admin123', 'admin1234', 'root', 'root123', 'toor', 'user', 'user123',
  'demo', 'temp', 'temp123', 'temptemp', 'default', 'hello', 'hello123',
  'hello1', 'sample', 'example', 'fuck', 'fuckyou', 'fuckoff', 'asshole',
  'bastard', 'bitch', 'pussy', 'dick', 'cock', 'shit',

  // Number patterns
  '111222', '112211', '121314', '123123123', '123456a', '1234554321',
  '123654', '123789', '1357924680', '147258', '147258369', '159357',
  '159951', '192837465', '19871987', '1q2w3e', '222222', '232323',
  '234567', '246810', '252525', '258456', '321321', '333333', '369369',
  '444444', '456123', '456789', '654123', '741852', '741852963', '753951',
  '789456', '789456123', '852456', '888888', '987654', '999999', '999999999',

  // Keyboard patterns
  'asdfasdf', 'asdfghjk', 'asdfghjkl', 'zxcvbnm123', 'qwertyui', 'qwertyu',
  'poiuytrewq', 'mnbvcxz', 'lkjhgfdsa', '1qazxsw2', '2wsx3edc', 'zaq1xsw2',
  'xsw2zaq1', 'cde3vfr4', 'rfv4cde3', 'tgb5rfv4', 'yhn6tgb5', 'ujm7yhn6',
  'ik,8ujm7', 'ol.9ik,8', 'p;/0ol.9',

  // Year patterns
  '2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008',
  '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017',
  '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025',

  // Common names (lowercase)
  'william', 'david', 'james', 'john', 'mike', 'chris', 'alex', 'eric',
  'kevin', 'ryan', 'jason', 'justin', 'brian', 'steve', 'adam', 'mark',
  'scott', 'paul', 'steven', 'timothy', 'jeff', 'joseph', 'richard',
  'sarah', 'jennifer', 'emily', 'samantha', 'elizabeth', 'hannah',
  'heather', 'brittany', 'stephanie', 'megan', 'olivia', 'emma', 'sophia',

  // Sports teams
  'cowboys', 'eagles', 'steelers', 'patriots', 'raiders', 'packers',
  'giants', 'broncos', 'seahawks', 'saints', 'ravens', 'chargers',
  'lakers', 'bulls', 'celtics', 'warriors', 'heat', 'spurs', 'knicks',
  'redsox', 'yankees', 'dodgers', 'cubs', 'mets', 'astros',

  // Animals
  'dog', 'cat', 'tiger', 'lion', 'bear', 'wolf', 'eagle', 'shark',
  'dolphin', 'elephant', 'monkey', 'snake', 'horse', 'chicken', 'bird',
  'fish', 'rabbit', 'turtle', 'panda', 'kitten', 'puppy',

  // Music references
  'music', 'piano', 'guitar', 'drums', 'violin', 'trumpet', 'flute',
  'singer', 'band', 'rock', 'jazz', 'blues', 'classical', 'hiphop',
  'country', 'metal', 'punk', 'disco', 'techno', 'house',

  // Tech/Gaming
  'computer', 'internet', 'google', 'facebook', 'twitter', 'instagram',
  'youtube', 'netflix', 'amazon', 'apple', 'microsoft', 'gaming',
  'playstation', 'xbox', 'nintendo', 'minecraft', 'fortnite', 'pokemon',
  'mario', 'zelda', 'halo', 'callofduty', 'worldofwarcraft', 'leagueoflegends',

  // Phrases
  'letmein', 'changeme', 'trustno1', 'iloveyou', 'fuckyou', 'whatever',
  'nothing', 'something', 'anything', 'everything', 'forever', 'always',
  'never', 'please', 'thanks', 'sorry', 'hello', 'goodbye', 'welcome',
  'opensesame', 'enterpassword', 'mypassword', 'yourpassword', 'thepassword',

  // Additional variations
  'password!', 'password@', 'password#', 'password$', 'Password1',
  'Password!', 'Password123', 'Password1234', 'PASSWORD', 'QWERTY',
  'Qwerty123', 'Admin123', 'Admin@123', 'Root123', 'User123',
]);

/**
 * Check if a password is in the common passwords list
 * Checks both exact match and lowercase version
 */
export function isCommonPassword(password: string): boolean {
  // Check exact match
  if (COMMON_PASSWORDS.has(password)) {
    return true;
  }

  // Check lowercase version
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return true;
  }

  // Check for simple variations
  // Remove trailing numbers and check again
  const withoutTrailingNumbers = password.replace(/\d+$/, '');
  if (
    withoutTrailingNumbers.length >= 4 &&
    COMMON_PASSWORDS.has(withoutTrailingNumbers.toLowerCase())
  ) {
    return true;
  }

  // Check for leet speak substitutions
  const deleeted = password
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's');

  if (COMMON_PASSWORDS.has(deleeted)) {
    return true;
  }

  return false;
}

/**
 * Get the count of common passwords in the list
 */
export function getCommonPasswordCount(): number {
  return COMMON_PASSWORDS.size;
}

let solstatus = false;
let problemobject = {};
const codeLanguage = {
  C: ".c",
  "C++": ".cpp",
  "C#": ".cs",
  Java: ".java",
  Python: ".py",
  Python3: ".py",
  JavaScript: ".js",
  Javascript: ".js",
};

console.log("GeeksForGeeks Script Loaded");

function getSolutionLanguage() {
  const languageElement =
    document.getElementsByClassName("divider text")[0].innerText;
  const lang = languageElement.split("(")[0].trim();
  if (lang.length > 0 && codeLanguage[lang]) {
    return codeLanguage[lang];
  }
  return null;
}

function getProblemTitle() {
  const problemTitleElement = document.querySelector(
    '[class^="problems_header_content__title"] > h3'
  ).innerText;
  if (problemTitleElement != null) {
    return problemTitleElement;
  }
  return "";
}

function getProblemDifficulty() {
  const problemDifficultyElement = document.querySelectorAll(
    '[class^="problems_header_description"]'
  )[0].children[0].innerText;
  if (problemDifficultyElement != null) {
    return problemDifficultyElement;
  }
  return "";
}

function getProblemStatement() {
  const problemStatementElement = document.querySelector(
    '[class^="problems_problem_content"]'
  );
  return `${problemStatementElement.outerHTML}`;
}

function getCompanyAndTopicTags() {
  const divTags = document.querySelectorAll('a[href^="/explore/?cat"]');
  const contentArray = [];
  divTags.forEach((divTag) => {
    contentArray.push(divTag.textContent.trim());
  });
  return contentArray;
}

const obs = new MutationObserver(function (_mutations, _observer) {
  const submitButton = document.querySelector(".problems_submit_button__6QoNQ");

  console.log("DOMContentLoaded event triggered");

  if (submitButton) {
    submitButton.addEventListener("click", () => {
      solstatus = false;
      const ps = setInterval(() => {
        const resultContainer = document.querySelector(
          ".problems_content_pane__nexJa"
        );

        if (
          resultContainer &&
          resultContainer.innerHTML.includes("Problem Solved Successfully")
        ) {
          const solutionLanguage = getSolutionLanguage();
          let problemTitle = getProblemTitle();
          const problemDifficulty = getProblemDifficulty();
          const problemStatement = getProblemStatement();
          const topics = getCompanyAndTopicTags(problemStatement);

          clearInterval(ps);

          let solution = null;

          chrome.runtime.sendMessage(
            { type: "getUserSolution" },
            async function (res) {
              let timesol = setInterval(async function () {
                solution = document.getElementById(
                  "extractedUserSolution"
                ).innerText;
                if (solstatus == false && solution != null) {
                  let problemTitle2 = problemTitle.split(" ");
                  let problemTitle3 = "";
                  problemTitle2.forEach((ele) => {
                    problemTitle3 += ele + "-";
                  });
                  problemTitle = problemTitle3.slice(0, -1);
                  console.log("Solution Language:", solutionLanguage);
                  console.log("Problem Title:", problemTitle);
                  console.log("Problem Difficulty:", problemDifficulty);
                  console.log("Problem Statement:", problemStatement);
                  console.log("Solution:", solution);
                  console.log("Topics:", topics);

                  let emailValue = "";

                  let userNameValue = "";

                  let tokenValue = "";

                  await chrome.storage.local.get(["email"]).then((result) => {
                    emailValue = result.email;
                    console.log(`Retrieved email value: ${emailValue}`);
                  });

                  await chrome.storage.local
                    .get(["username"])
                    .then((result) => {
                      userNameValue = result.username;
                      console.log(`Retrieved username value: ${userNameValue}`);
                    });

                  await chrome.storage.local.get(["token"]).then((result) => {
                    tokenValue = result.token;
                    console.log(`Retrieved tokenValue  : ${tokenValue}`);
                  });

                  const question = {
                    questionId: "1",
                    title: problemTitle,
                    titleSlug: problemTitle,
                    content: problemStatement,
                    difficulty: problemDifficulty,
                  };

                  problemobject.lang = solutionLanguage;
                  problemobject.tagArray = topics;
                  problemobject.solutionCode = solution;
                  problemobject.question = question;
                  problemobject.username = userNameValue;
                  problemobject.email = emailValue;
                  problemobject.token = tokenValue;

                  console.log(problemobject);

                  await createOrUpdateSolutionFile(problemobject);
                }
                chrome.runtime.sendMessage({ type: "deleteNode" }, function () {
                  console.log("deleteNode - Message Sent.");
                });
                clearInterval(timesol);
              }, 1000);
            }
          );
        } else {
          console.log("Problem not solved or result container not found");
        }
      }, 1000);
    });
  } else {
    console.log("Submit button not found");
  }
});

setTimeout(() => {
  obs.observe(document.body, { childList: true, subtree: true });
}, 1000);

async function createOrUpdateSolutionFile(solutionObj) {
  let githubApi = "https://api.github.com/repos";

  let url = `${githubApi}/${solutionObj.username}/AlgoPrep/${solutionObj.question.titleSlug}/${solutionObj.question.titleSlug}.${solutionObj.lang}`;

  let folderInfo = await getFolderInfo(url, solutionObj.token);

  if (folderInfo.sha) {
    console.log("already folder exists");
    // should   solution.py
  } else {
    console.log("trying to create");

    // should pass content,filename,type

    await createFile(
      solutionObj,
      solutionObj.question.content,
      `README`,
      `.md`
    );
    await createFile(
      solutionObj,
      solutionObj.solutionCode,
      solutionObj.question.titleSlug,
      solutionObj.lang
    );
  }
}

async function getFolderInfo(url, token) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.log("err ->", response);
  }
  return await response.json();
}

async function createOrUpdateSolutionFile(solutionObj) {
  let githubApi = "https://api.github.com/repos";

  let url = `${githubApi}/${solutionObj.username}/AlgoPrep/${solutionObj.question.titleSlug}/${solutionObj.question.titleSlug}.${solutionObj.lang}`;

  let folderInfo = await getFolderInfo(url, solutionObj.token);

  if (folderInfo.sha) {
    console.log("already folder exists");
    // should   solution.py
  } else {
    console.log("trying to create");

    // should pass content,filename,type

    await createFile(
      solutionObj,
      solutionObj.question.content,
      `README`,
      `.md`
    );
    await createFile(
      solutionObj,
      solutionObj.solutionCode,
      solutionObj.question.titleSlug,
      solutionObj.lang
    );

    let dataObjJson = await getDataJSON(
      solutionObj.username,
      solutionObj.token
    );

    console.log("dataObjJSON", dataObjJson);

    if (dataObjJson == false) {
      console.log("trying to create data.json file if not exists");

      await createDataJSON(solutionObj);
    } else {
      let { sha, content } = dataObjJson;
      console.log("sha", sha);
      console.log("conetent", content);

      console.log("should update data json file");
      await updateDataJSON(solutionObj, sha, content);
    }

  }
}

async function getFolderInfo(url, token) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.log("err ->", response);
  }
  return await response.json();
}

// leetcode.js:84 <span data-e2e-locator=​"submission-result">​Accepted​</span>​
// leetcode.js:127 Retrieved email value: notimportantupdatesonly@gmail.com
// leetcode.js:132 Retrieved email value: codewithunknown
// leetcode.js:145 new data from LeetCode API and formatted: {lang: '.py', tagArray: Array(3), solutionCode: 'class Solution:\n    def containsDuplicate(self, nu…\n            hashset.add(n)\n        return False\n', question: {…}, submissionId: '1150284898', …}
// leetcode.js:52 sol obj {lang: '.py', tagArray: Array(3), solutionCode: 'class Solution:\n    def containsDuplicate(self, nu…\n            hashset.add(n)\n        return False\n', question: {…}, submissionId: '1150284898', …}email: "notimportantupdatesonly@gmail.com"lang: ".py"question: content: "<p>Given an integer array <code>nums</code>, return <code>true</code> if any value appears <strong>at least twice</strong> in the array, and return <code>false</code> if every element is distinct.</p>\n\n<p>&nbsp;</p>\n<p><strong class=\"example\">Example 1:</strong></p>\n<pre><strong>Input:</strong> nums = [1,2,3,1]\n<strong>Output:</strong> true\n</pre><p><strong class=\"example\">Example 2:</strong></p>\n<pre><strong>Input:</strong> nums = [1,2,3,4]\n<strong>Output:</strong> false\n</pre><p><strong class=\"example\">Example 3:</strong></p>\n<pre><strong>Input:</strong> nums = [1,1,1,3,3,4,3,2,4,2]\n<strong>Output:</strong> true\n</pre>\n<p>&nbsp;</p>\n<p><strong>Constraints:</strong></p>\n\n<ul>\n\t<li><code>1 &lt;= nums.length &lt;= 10<sup>5</sup></code></li>\n\t<li><code>-10<sup>9</sup> &lt;= nums[i] &lt;= 10<sup>9</sup></code></li>\n</ul>\n"difficulty: "Easy"questionId: "217"title: "Contains Duplicate"titleSlug: "contains-duplicate"[[Prototype]]: ObjectsolutionCode: "class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        hashset = set()\n\n        for n in nums:\n            if n in hashset:\n                return True\n            hashset.add(n)\n        return False\n"submissionId: "1150284898"tagArray: Array(3)0: "array"1: "hash-table"2: "sorting"length: 3[[Prototype]]: Array(0)username: "codewithunknown"[[Prototype]]: Object

async function createFile(createFileObj, content, fileName, type) {
  const url = `https://api.github.com/repos/${createFileObj.username}/AlgoPrep/contents/${createFileObj.question.titleSlug}/${fileName}${type}`;
  const encodedContent = btoa(content);

  const body = {
    message: `solved ${createFileObj.question.title}`,
    content: encodedContent,
    branch: "main",
    committer: {
      name: createFileObj.username,
      email: createFileObj.email ?? "notimportantupdatesonly@gmail.com",
    },
  };

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer  ${createFileObj.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.log(response);
      throw new Error(
        `Failed to create: ${response.status} ${response.statusText}`
      );
    } else {
      const data = await response.json();
      console.log(`File created. SHA: ${data.content.sha}`);
    }
  } catch (error) {
    console.error(error);
  }
}

async function createDataJSON(createFileObj) {
  const url = `https://api.github.com/repos/${createFileObj.username}/AlgoPrep/contents/data.json`;

  let tempQuestionName = createFileObj.question.titleSlug;

  let content = {
    [tempQuestionName]: {
      date: new Date().toDateString(),
      questiontitle: createFileObj.question.titleSlug,
      code: createFileObj.solutionCode,
      question: createFileObj.question.content,
      platform: "leetcode",
      difficulty: createFileObj.question.difficulty,
      tags: createFileObj.tagArray,
      qlink: `https://leetcode.com/problems/${createFileObj.question.titleSlug}`,
      githublink: `https://github.com${createFileObj.username}/AlgoPrep/tree/main/${createFileObj.question.titleSlug}`,
    },
  };

  const encodedContent = btoa(JSON.stringify(content));

  const body = {
    message: `created json file`,
    content: encodedContent,
    branch: "main",
    committer: {
      name: createFileObj.username ?? "codewithunknown",
      email: createFileObj.email ?? "notimportantupdatesonly@gmail.com",
    },
  };

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer  ${createFileObj.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.log(response);
      throw new Error(
        `Failed to create: ${response.status} ${response.statusText}`
      );
    } else {
      const data = await response.json();
      console.log(`File created. SHA: ${data.content.sha}`);
    }
  } catch (error) {
    console.error(error);
  }
}

async function getDataJSON(username, token) {
  const url = `https://api.github.com/repos/${username}/AlgoPrep/contents/data.json`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer  ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // File not found
        return false;
      } else {
        console.log(response);
        throw new Error(
          `Failed to fetch: ${response.status} ${response.statusText}`
        );
      }
    } else {
      const data = await response.json();

      // Decode content from base64 and parse JSON
      const content = JSON.parse(atob(data.content));

      return {
        sha: data.sha,
        content: content,
      };
    }
  } catch (error) {
    console.error(error);
    return null; // Handle the error as needed in your application
  }
}

async function updateDataJSON(createFileObj, sha, alreadyContent) {
  const url = `https://api.github.com/repos/${createFileObj.username}/AlgoPrep/contents/data.json`;

  let tempQuestionName = createFileObj.question.titleSlug;

  alreadyContent[tempQuestionName] = {
    date: new Date().toDateString(),
    questiontitle: createFileObj.question.titleSlug,
    code: createFileObj.solutionCode,
    question: createFileObj.question.content,
    platform: "leetcode",
    difficulty: createFileObj.question.difficulty,
    tags: createFileObj.tagArray,
    qlink: `https://leetcode.com/problems/${createFileObj.question.titleSlug}`,
    githublink: `https://github.com/${createFileObj.username}/AlgoPrep/tree/main/${createFileObj.question.titleSlug}`,
  };

  const encodedContent = btoa(JSON.stringify(alreadyContent));

  const body = {
    message: `updated json file`,
    content: encodedContent,
    branch: "main",
    committer: {
      name: createFileObj.username ?? "codewithunknown",
      email: createFileObj.email ?? "notimportantupdatesonly@gmail.com",
    },
    sha: sha, // Pass the sha correctly for updating
  };

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${createFileObj.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.log(response);
      throw new Error(
        `Failed to update: ${response.status} ${response.statusText}`
      );
    } else {
      const data = await response.json();
      console.log(`File updated. New SHA: ${data.content.sha}`);
    }
  } catch (error) {
    console.error(error);
  }
}

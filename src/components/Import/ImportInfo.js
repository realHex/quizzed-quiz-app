import React from 'react';

const ImportInfo = () => {
  return (
    <div className="upload-info">
      <h3>CSV Format Requirements:</h3>
      <ul>
        <li>Column headers: Type, Question, Option1, Option2, Option3, Option4, Correct</li>
        <li>Type can be: MCQ (Multiple Choice), YESNO, or MULTI</li>
        <li>For YESNO, Correct should be 'yes' or 'no' (case-insensitive)</li>
        <li>For MCQ, Correct should be the index (1-4) of the correct option</li>
        <li>For MULTI, Correct should be a semicolon-separated list of correct indices (e.g., "1;2;3")</li>
      </ul>
      <div className="csv-example">
        <h4>Example:</h4>
        <pre>
          Type,Question,Option1,Option2,Option3,Option4,Correct<br />
          MCQ,"What is 2+2?","3","4","5","6",2<br />
          YESNO,"Is the sky blue?",,,,,yes<br />
          MULTI,"Select all prime numbers","2","3","4","5","1;2;4"
        </pre>
      </div>
    </div>
  );
};

export default ImportInfo;

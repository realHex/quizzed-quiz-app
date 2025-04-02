import React, { useState } from 'react';

const HelpModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('create');

  if (!isOpen) return null;

  return (
    <div className="help-modal-backdrop">
      <div className="help-modal">
        <div className="help-modal-header">
          <h2>How to Generate Questions</h2>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="help-tabs">
          <button 
            className={`help-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Questions
          </button>
          <button 
            className={`help-tab ${activeTab === 'slides' ? 'active' : ''}`}
            onClick={() => setActiveTab('slides')}
          >
            Create Questions with Slides Attached
          </button>
        </div>
        
        <div className="help-content">
          {/* Regular questions tab content */}
          {activeTab === 'create' && (
            <div className="help-steps">
              <h3>Steps for Creating Questions</h3>
              <ol>
                <li>Go to an LLM of choice (Claude preferred)</li>
                <li>Copy and paste the prompt below</li>
                <div className="prompt-box">
                  <pre>
                    I want you to make a set of questions that covers everything in the subject content. You can make yes/no questions, multiple choice questions with 4 options, Multiple choice questions with 4 options that have multiple answers. I will provide you a pdf, and you need to cover every single data on this pdf. Apart from the pdf, I have some extra notes, so be sure to convert all the data in those notes to questions as well. There is no limit to the number of questions. And finally arrange the questions in the following structure only. No categorization, and strictly follow the structure.
                    {"\n\n"}
                    Structure {"\n"}
                    Type,Question,Option1,Option2,Option3,Option4,Correct{"\n"}
                    MCQ,"What is 2+2?","3","4","5","6",2{"\n"}
                    YESNO,"Is the sky blue?",,,,,yes{"\n"}
                    MULTI,"Select all prime numbers","2","3","4","5","1;2;4"{"\n"}
                    {"\n\n"}
                    Extra Notes:{"\n"} 
                  </pre>
                </div>
                <li>If you have any extra notes apart from the module content, add them to the notes section</li>
                <li>Attach the pdf and generate</li>
                <li>Finally copy the csv content and paste it in the box</li>
              </ol>
              
              <div className="help-notes">
                <h3>Points to remember</h3>
                <ul>
                  <li>Sometimes some LLMs fail to follow the structure given, this can cause the quiz to not work.</li>
                  <li>This works best if your material is less than 30 pages long.</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Questions with slides tab content */}
          {activeTab === 'slides' && (
            <div className="help-steps">
              <h3>Steps for Creating Questions with Slides</h3>
              <ol>
                <li>Go to an LLM of choice (Claude preferred)</li>
                <li>Copy and paste the prompt below</li>
                <div className="prompt-box">
                  <pre>
                  I want you to make a set of questions that covers everything in the subject content. You can make yes/no questions, multiple choice questions with 4 options, Multiple choice questions with 4 options that have multiple answers. I will provide you a pdf, and you need to cover every single data on this pdf. Apart from the pdf, I have some extra notes, so be sure to convert all the data in those notes to questions as well. There is no limit to the number of questions. And finally arrange the questions in the following structure only. No categorization, and strictly follow the structure. For the 8th Header column 'Slide', if the question was made from the data taken from the pdf file, then you need to put the pdf page number. If the question was made from the data taken from the extra notes I provided, then it should be the text sentences.
                    {"\n\n"}
                    Structure {"\n"}
                    Type,Question,Option1,Option2,Option3,Option4,Correct,Slide{"\n"}
                    MCQ,"What is 2+2?","3","4","5","6",2,3{"\n"}
                    YESNO,"Is the sky blue?",,,,,yes,"The sky appears blue due to Rayleigh scattering"{"\n"}
                    MULTI,"Select all prime numbers","2","3","4","5","1;2;4",5{"\n"}
                    {"\n\n"}
                    Extra Notes:{"\n"} 
                  </pre>
                </div>
                <li>If you have any extra notes apart from the module content, add them to the notes section</li>
                <li>Attach the pdf and generate</li>
                <li>Finally copy the csv content and paste it in the box</li>
                <li>Upload your PDF in the "PDF for Slides" section or select an existing one</li>
              </ol>
              
              <div className="help-notes">
                <h3>Points to remember</h3>
                <ul>
                  <li>Sometimes some LLMs fail to follow the structure given, this can cause the quiz to not work.</li>
                  <li>This works best if your material is less than 30 pages long.</li>
                  <li>This works better if you have the material numbered. Example at the bottom right of the pdf. But make sure the numbers start from the very first page itself. If you do decide to add numbers, add  {"(page number is at the bottom right of the pdf page)"} after the sentence "For the 8th Header column 'Slide', if the question was made from the data taken from the pdf file, then you need to put the pdf page number" 
                  {"\n"} 
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;

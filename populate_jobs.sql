-- Populate web design job
UPDATE jobs SET
  requirements = 'Proficiency in HTML, CSS, and JavaScript. Experience with responsive and mobile-first design. Familiarity with UI/UX principles and wireframing tools such as Figma. Knowledge of web accessibility standards (WCAG). Experience with modern frameworks like React or Vue.js. Portfolio of prior web design work required.',
  description = 'We are looking for a creative and detail-oriented Web Designer to design and build modern, user-friendly websites. You will collaborate with developers and stakeholders to deliver visually compelling digital experiences.',
  tags = '["UI/UX Design", "Responsive Design", "Front-End Development"]'
WHERE LOWER(title) = 'web design';

-- Populate graphic designer job
UPDATE jobs SET
  requirements = 'Proficiency in Adobe Creative Suite (Photoshop, Illustrator, InDesign). Strong understanding of typography, color theory, and visual hierarchy. Experience creating brand identity materials, marketing assets, and digital graphics. Ability to translate creative briefs into compelling visuals. Portfolio demonstrating a range of design styles and projects.',
  description = 'We are seeking a talented Graphic Designer to create visually stunning materials for digital and print media. You will work closely with the marketing team to maintain brand consistency and deliver high-quality design assets.',
  tags = '["Adobe Creative Suite", "Brand Identity", "Visual Communication"]'
WHERE LOWER(title) = 'graphic designer';

-- Verify
SELECT id, title, requirements, tags FROM jobs WHERE id IN (4,5);

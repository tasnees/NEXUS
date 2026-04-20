-- Auto-generated migration from local → Docker nexthire DB
SET session_replication_role = replica;  -- disable FK checks temporarily


-- users: 1 rows
INSERT INTO users (user_id, name, email, password, role) VALUES (1, 'John Doe', 'john@example.com', 1234567, 'hr_admin') ON CONFLICT DO NOTHING;

-- jobs: 5 rows
INSERT INTO jobs (id, title, company_logo, location, posted_at, status, applicants, match_rate, interviewed, tags, company, salary, time_per_week, nature, requirements, description) VALUES (1, 'Principal Neural Architect', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXUe0dmBI_6Ahqs12jg49xCqnskPbWVbJiDJo-a8JpMvraRUoQRiVW2GPG0395sCABn0bzSPqmE4NlyGxXLNTx_YyDFK6QXj51d6Rf8aDLbxfrwWO4bUxQ_ixa3KvJaqDCBNZK5t-66FlUyxvWpYp0dOSwdLAoGZlEF5CtWnRYOC9K9L1GMnUZ9zbZnpADAd0E38c0U_DmPBkK0mMmYJzOwQ-AwpFqF1GOJethPdY5gsGaKxVbl2Z4pyv_nCU7EB_cA9aoDwjyEENM', 'Austin, TX', 'Posted 2 days ago', 'Live Posting', 48, 92, 12, '["PyTorch", "Distributed Systems"]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO jobs (id, title, company_logo, location, posted_at, status, applicants, match_rate, interviewed, tags, company, salary, time_per_week, nature, requirements, description) VALUES (2, 'Senior MLOps Engineer', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXAJqZSdeZJRJgYbzeqjAKNplDLbJ3PTxuzQUNkJKQ643lr8SN-_cuiwlcKmYoxqUslVFau2cGeWenp1IHW4FR4xWTNJ6vDGFA2scYZsKqtI5-CGAnrJwureBfaVPVS9Zh9JdgBnbtlY4f1lsAB-8H_bXC2XvqjLB9Sz9bN4pTvhvJDVRFbLbcuUHd9vSZmJJlqdyWuhHpprAWUt65ZWDrv5WDABgWptGPCNRQkXfFRk9gU_SM9myUtJBQrmjNkRUfQRUDMw18ckTT', 'Remote', 'Posted 5 days ago', 'Action Required', 156, 85, 3, '["Kubernetes", "Terraform"]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO jobs (id, title, company_logo, location, posted_at, status, applicants, match_rate, interviewed, tags, company, salary, time_per_week, nature, requirements, description) VALUES (3, 'Director of Product (Gen AI)', 'https://lh3.googleusercontent.com/aida-public/AB6AXuByDir7XIdCHyPtSmLy31zsy9FR3d_l2pfX44YKo8Frwz-Gn1CGuq7qxLV6ZUjRhw4lXMvyNP8-wPTSiX8sExN5woHDWKNQv9QtMdPCMn3yRPTEcmU4W8n1MLhOu-0w27drP843bMYODrgv8ulizjprqMoZ6ZkH0HfL4pa498QS7dqqdgIl5qQOCn7WXE1_BZUpqBQzruC2uX8wFyHlslrelaaSrb5poJC6QuVkIeBK958I2S7D0Fa6Tto9uqwcpBM0rASkvIj1Qcnn', 'London, UK', 'Posted 1 week ago', 'Live Posting', 32, 97, 8, '["Product Strategy", "NLP"]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO jobs (id, title, company_logo, location, posted_at, status, applicants, match_rate, interviewed, tags, company, salary, time_per_week, nature, requirements, description) VALUES (4, 'graphic designer', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXUe0dmBI_6Ahqs12jg49xCqnskPbWVbJiDJo-a8JpMvraRUoQRiVW2GPG0395sCABn0bzSPqmE4NlyGxXLNTx_YyDFK6QXj51d6Rf8aDLbxfrwWO4bUxQ_ixa3KvJaqDCBNZK5t-66FlUyxvWpYp0dOSwdLAoGZlEF5CtWnRYOC9K9L1GMnUZ9zbZnpADAd0E38c0U_DmPBkK0mMmYJzOwQ-AwpFqF1GOJethPdY5gsGaKxVbl2Z4pyv_nCU7EB_cA9aoDwjyEENM', 'Hybrid', 'Posted just now', 'Live Posting', 0, 0, 0, '[""]'::jsonb, 'tekup', '50', '30', 'hybrid', '', '') ON CONFLICT DO NOTHING;
INSERT INTO jobs (id, title, company_logo, location, posted_at, status, applicants, match_rate, interviewed, tags, company, salary, time_per_week, nature, requirements, description) VALUES (5, 'web design', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXUe0dmBI_6Ahqs12jg49xCqnskPbWVbJiDJo-a8JpMvraRUoQRiVW2GPG0395sCABn0bzSPqmE4NlyGxXLNTx_YyDFK6QXj51d6Rf8aDLbxfrwWO4bUxQ_ixa3KvJaqDCBNZK5t-66FlUyxvWpYp0dOSwdLAoGZlEF5CtWnRYOC9K9L1GMnUZ9zbZnpADAd0E38c0U_DmPBkK0mMmYJzOwQ-AwpFqF1GOJethPdY5gsGaKxVbl2Z4pyv_nCU7EB_cA9aoDwjyEENM', 'Hybrid', 'Posted just now', 'Live Posting', 0, 0, 0, '[""]'::jsonb, '', '', '', 'hybrid', '', '') ON CONFLICT DO NOTHING;

-- candidates: 5 rows
INSERT INTO candidates (id, drive_file_id, filename, name, email, phone, summary, skills, experience, education, raw_text, created_at, updated_at, applied_job, assessment_results) VALUES (3, '10EA3hPJ3FB5I5mCaV6Y_ECjmkAkhDQxb', 'Tasneem graba (8).pdf', 'Tasneem Graba', 'graba.tassnim@gmail.com', 'Aryenah , tunisia', 'Data science and AI engineering student focused on developing strong foundations in machine learning, data analysis, and software engineering. Motivated, detail-oriented, and eager to contribute to meaningful, technology-driven initiatives.', '["Machine Learning & Predictive Modeling", "AWS", "Node.js", "Express", "Python Development (APIs, data pipelines)", "Git", "MongoDB", "SQLite3", "Postgres", "Problem Solving", "Fast learner / adaptability to new technologies", "Team collaboration & cross-functional communication", "Analytical Thinking", "Initiative & self-driven", "Accountability & reliability", "Attention to detail and quality"]'::jsonb, '["Intern, Omnilik Jul 2025 - Aug 2025: Built a coworking platform using React, Node.js, Express, and MongoDB, gaining hands-on full-stack experience and improving system usability and workflow management.", "Gained valuable experience working within a specific industry, applying learned concepts directly into relevant work situations.", "Analyzed problems and worked with teams to develop solutions."]'::jsonb, '["Pre engineering Sep 2021 - Jun 2023: IPEIN - Completed an intensive curriculum in mathematics, physics, and introductory engineering subjects. Built strong analytical, problem-solving, and technical reasoning skills through labs, projects, and coursework.", "Engineering May 2014 - May 2016: Tek-Up University - curriculum focused on machine learning, software engineering, and data-driven problem solving. Merit scholarship, 2024 and 2025 from Tek-up university."]'::jsonb, 'TASNEEM GRABA
AI/ML ENGINEER
Aryenah , tunisia | personal portfolio | graba.tassnim@gmail.com
Data science and AI engineering student focused on developing strong foundations in machine learning,
data analysis, and software engineering. Motivated, detail-oriented, and eager to contribute to meaningful,
technology-driven initiatives.
AREA OF EXPERTISE
Machine Learning & Predictive Modeling Aws node js , express
Python Development (APIs, data pipelines) Git Hub MongoDB , SQLite3 , Postgres
KEY ACHIEVEMENTS
Developed AI-powered healthcare tools, including a diabetes detection assistant (SmartDiab),
applying machine learning to support clinical decision-making.
Participated in hackathons (including the Qubic Hackathon), developing the Qubic Autopilot and
delivering working AI features under tight deadlines.
PROFESSIONAL EXPERIENCE
Intern, Omnilik Jul 2025 - Aug 2025
Built a coworking platform using React, Node.js, Express, and MongoDB, gaining hands-on full-stack
experience and improving system usability and workflow management.
Gained valuable experience working within a specific industry, applying learned concepts directly into
relevant work situations.
Analyzed problems and worked with teams to develop solutions.
SKILLS
Problem Solving Fast learner / adaptability to new Team collaboration & cross-functional
Analytical Thinking technologies communication
Initiative & self-driven Accountability & reliability Attention to detail and quality
EDUCATION
Pre engineering Sep 2021 - Jun 2023
IPEIN
Completed an intensive curriculum in mathematics, physics, and introductory engineering subjects. Built strong
analytical,
problem-solving, and technical reasoning skills through labs, projects, and coursework.
Engineering May 2014 - May 2016
Tek-Up University
curriculum focused on machine learning, software engineering, and data-driven problem solving.
Merit scholarship, 2024 and 2025 from Tek-up university
ADDITIONAL INFORMATION
Languages: English, French.
Certifications: Python Certified Associate Programmer (PCAP) , industry recognized Samsung AI
course certificate.
Awards/Activities: secured a top five rank in qubic hack the future Nostromo Launchpad track
hackathon', '2026-03-27 22:16:50.119848+01:00', NULL, 'web design', '[]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO candidates (id, drive_file_id, filename, name, email, phone, summary, skills, experience, education, raw_text, created_at, updated_at, applied_job, assessment_results) VALUES (5, '1H32kzKBHLgThN8T44lovkGQADVVaT2tW', 'Grey Modern Monochrome Content Creator CV Resume.pdf', 'Estelle Darcy', 'hello@reallygreatsite.com', '123-456-7890', 'Creative and detail-oriented Content Creator with 3+ years of experience producing engaging content for online platforms. Skilled in writing, editing, and content strategy development.', '["Content Writing", "Editing", "SEO Optimization", "Social Media Management", "Video Production", "Graphic Design"]'::jsonb, '["Content Creator at Ginyard International Co. (2021 - Present): Produced high-quality written and visual content for website, social media, and email marketing campaigns. Collaborated with marketing team to develop content strategies that increased engagement and brand awareness. Utilize analytics tools to track performance metrics, analyze audience insights, and optimize content strategy for maximum reach and impact."]'::jsonb, '["Bachelor''s Degree in Communication from Rimberio University, Graduated May 2018"]'::jsonb, 'E S T E L L E 123-456-7890
DARCY hello@reallygreatsite.com
123 Anywhere St.,
Any City
C O N T E N T C R E A T O R
Creative and detail-oriented Content Creator with
3+ years of experience producing engaging content
for online platforms. Skilled in writing, editing, and
content strategy development.
E X P E R I E N C E
Content Creator
S K I L L S
Ginyard International Co. 2021 - Present
Produced high-quality written and visual
Content Writing
content for website, social media, and email
Editing
marketing campaigns.
Collaborated with marketing team to develop SEO Optimization
content strategies that increased engagement Social Media Management
and brand awareness.
Video Production
Utilize analytics tools to track performance
Graphic Design
metrics, analyze audience insights, and optimize
content strategy for maximum reach and
impact.
P O R T F O L I O
E D U C A T I O N www.reallygreatsite.com
Links to blog posts,
Bachelor''s Degree in Communication articles, videos, or other
Rimberio University, Graduated May 2018 content created by the
candidate.
C E R T I F I C A T I O N S L A N G U A G E S
Content Marketing Certification English (Native)
Arowwai Industries, June 2019 Spanish (Intermediate)', '2026-03-27 22:17:04.456930+01:00', NULL, 'graphic designer', '[]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO candidates (id, drive_file_id, filename, name, email, phone, summary, skills, experience, education, raw_text, created_at, updated_at, applied_job, assessment_results) VALUES (4, '1XGuApbTjA-IR2R8Zfq7Wmbfcs71BcNCf', 'Black and White Simple Minimalist CV Resume.pdf', 'Wahana Prima', 'hello@reallygreatsite.com', '123-456-7890', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc a ultricies tortor. In vestibulum vitae velit nec viverra. Proin non ultrices ex. Integer mattis dui vel pretium euismod.', '["Web Design", "Problem-Solving", "Project Management Tools", "Design Thinking", "Computer Literacy", "Strong Communication", "Wireframe Creation", "Front End Coding", "Leadership"]'::jsonb, '["2014 - 2016 WARDIERE COMPANY | GRAPHIC SOFTWARE DESIGNER", "2016 - Present LARANA COMPANY | WEB CONTENT MANAGER"]'::jsonb, '["2010 - 2014 BORCELLE UNIVERSITY | BACHELOR OF DEVELOPER", "2014 - 2016 BORCELLE UNIVERSITY | MASTER OF DESIGNER"]'::jsonb, 'Wahana Prima
Specialist Graphic Designer
123-456-7890 hello@reallygreatsite.com 123 Anywhere St., Any City
ABOUT ME
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc a ultricies tortor. In vestibulum vitae velit
nec viverra. Proin non ultrices ex. Integer mattis dui vel pretium euismod.
EDUCATION
2010 - 2014 BORCELLE UNIVERSITY | BACHELOR OF DEVELOPER
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc a ultricies tortor. In
vestibulum vitae velit nec viverra. Proin non ultrices ex. Integer mattis dui vel
pretium euismod.
2014 - 2016 BORCELLE UNIVERSITY | MASTER OF DESIGNER
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc a ultricies tortor. In
vestibulum vitae velit nec viverra. Proin non ultrices ex. Integer mattis dui vel
pretium euismod.
WORK EXPERIENCE
2014 - 2016 WARDIERE COMPANY | GRAPHIC SOFTWARE DESIGNER
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc a ultricies tortor. In
vestibulum vitae velit nec viverra. Proin non ultrices ex. Integer mattis dui vel
pretium euismod.
2016 - Present LARANA COMPANY | WEB CONTENT MANAGER
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc a ultricies tortor. In
vestibulum vitae velit nec viverra. Proin non ultrices ex. Integer mattis dui vel pretium
euismod.
SKILLS
Web Design Problem-Solving Project Management Tools
Design Thinking Computer Literacy Strong Communication
Wireframe Creation Front End Coding Leadership', '2026-03-27 22:16:57.732026+01:00', NULL, 'web design', '[]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO candidates (id, drive_file_id, filename, name, email, phone, summary, skills, experience, education, raw_text, created_at, updated_at, applied_job, assessment_results) VALUES (2, '1OcjljYq5hTkEuKb2N8eNzSXSV16RZa0O', 'MikeSmith_CV.pdf', 'Mike Smith', 'hello@mikesmithdesign.co.uk', '07539 320308', 'I am a self driven and committed graphic designer with years of experience in a number of different design fields, both as a freelancer and at agency level. My primary strengths are in web design and development but I also have extensive experience in branding and identity, editorial design, art direction, typography, and illustration.', '["Web/UI design using Adobe Creative Suite", "Sketch", "Prototyping tools such as InVision", "Front-end development using HTML5", "CSS3", "Javascript (ES5 and ES6)", "jQuery", "CSS preprocessors such as SASS", "Web-based animation using jQuery and native CSS animations", "Building web-based applications using React.js", "Code standards and compliance for accessibility", "Module Bundlers and Task Runners such as NPM and Webpack", "Complex content managed websites using Expression Engine and WordPress", "Web-based programming languages, systems and frameworks including SQL, PHP, Git", "Domain, server and database administration in a LAMP environment", "Creating and editing video content with After Effects and Premiere", "SEO best practice", "3D modelling and photorealistic rendering", "Identity design including name generation, logo design and typographic treatment"]'::jsonb, '["Freelance Graphic Designer & Developer at Mike Smith Design (Jul 2012 - Present)", "Digital Designer at Sears Davies (Aug 2015 - Present)", "In-House Designer at VoIP Unlimited (May 2015 - Aug 2015)"]'::jsonb, '["BA (Hons) - Graphic Design (1st Class) at Arts University Bournemouth (Sept 2012 - May 2015)", "Foundation Diploma in Art & Design at University for the Creative Arts (Sept 2011 - Jun 2012)", "Various Qualifications at Oakwood Park Grammar School (Sept 2004 - May 2011)"]'::jsonb, 'Curriculum Vitae: Mike Smith
Graphic Designer & Front End Developer
You are viewing an offline version of my CV, however, this document is best viewed
online at mikesmithdesign.co.uk/curriculum-vitae.
Contact Details Personal Profile
hello@mikesmithdesign.co.uk
I am a self driven and committed graphic designer with years of experience in a number of different design fields, both as
07539 320308
a freelancer and at agency level. I graduated Arts University Bournemouth in July 2015 with a First-class honours degree in
Graphic Design. I am currently working as a freelance designer having just left an agency role of 3 years with Sears Davies.
Tooting, London SW17
My primary strengths are in web design and development but I also have extensive experience in branding and identity,
editorial design, art direction, typography, and illustration.
mikesmithdesign.co.uk
Outside of work I’m a Spurs fan, a bit of a foodie and a lover of tattoo art. I have a keen interest in music, having played in
bands from a young age. I now DJ and produce music as well designing t-shirts, poster prints and wall art.
References Freelance Roles
Julian Davies JuL 2012 - Present Mike Smith Design
Managing Director Varios, UK Graphic Designer & Developer
Sears Davies Designers
Throughout university & my professional career I have managed my own freelance design
4th Floor, 57a Great Suffolk Street
business. During a period spanning 6 years to date I have maintained over 100 client
London SE1 0BB
relationships & developed working partnerships with organisations such as Bournemouth
+44 (0)20 7633 0939 University & PumpAid. My early expertise was in branding & identity design but I soon
julian@searsdavies.com expanded my offering to include services such as brochure & book design as well as web
development & e-mail marketing.
Key Responsibilities:
- Producing a range of print based media including corporate identities, stationery, books, brochures,
flyers and packaging
- Developing digital content including websites, email campaigns, social media artwork, videos and
animations
- Networking with potential clients to develop new business opportunities
- Consulting and advising clients on the best approach to their branding and online presence
- Maintaining client relationships through regular checkups, maintenance and brand progression
- Managing all accounts, costings and budgeting
Permanent Roles
Aug 2015 - Present Sears Davies
London, UK Digital Designer
A London based agency with clients including Manchester United Football Club, Aviva and
Barclays. I worked as part of a close knit team of designers, dealing primarily in front end
web design. I was responsible for the design, build and delivery of web projects as well as
assisting with branding and print design. During my time at Sears Davies, I was involved in
a number of professionally recognised and award winning projects.
Key Responsibilities:
- Designing, building and delivering responsive, scalable web-based interfaces
- Producing costings and budgets for web projects
- Providing support and training to clients on the administration and maintenance of their websites
- Designing, building and delivering HTML email campaigns
- Providing information and support on all digital queries to colleagues and clients
- Supporting business directors with my digital expertise during client meetings
- Preparing and retouching images for a variety of applications
- Server and domain administration including DNS setup and database configuration
- Designing corporate identities, stationery, literature and signage
May 2015 - Aug 2015 VoIP Unlimited
Bournemouth, UK In-House Designer
During my time at market leading telecommunications company, VoIP Unlimited, my role
was in-house designer. Working closely with web developers and marketing executives
I produced content for a number of tasks ranging from redesigning business cards to
cutting edge web applications.
Key Responsibilities:
- Producing brand guidelines for the company
- Designing user interfaces for both web and software applications
- Producing imagery and content for email marketing campaigns
- Creating illustrations, iconography and animations for use on the customer facing website
Awards & Recognition
CSS Design Awards CSS Awards
Special Design Kudos Nominee
One Page Love
Hiive
Honorable Website
Remix Competition Winner
Skills & Expertise
Technical Skills - Proficient in Web/UI design using the Adobe Creative Suite, Sketch and prototyping tools such as InVision
- Accomplished in front-end development using HTML5, CSS3, Javascript (ES5 and ES6) and jQuery
- Adept in front end development workflows, most notably CSS preprocessors such as SASS
- Skilled in web-based animation using jQuery and native CSS animations
- Experience of building web-based applications using React.js
- Thorough understanding of code standards, compliance for accessibility and device profiles
- Extensive experience with Module Bundlers and Task Runners such as NPM and Webpack via the
command line
- Proven track record developing complex content managed websites using Expression Engine and
WordPress
- Working knowledge of other web-based programming languages, systems and frameworks for instance
SQL, PHP, Git
- Experience working with domain, server and database administration in a LAMP environment using
platforms such as Plesk, cPanel and phpMyAdmin
- Competent at creating and editing video content for the web with After Effects and Premiere
- Good understanding of SEO best practice
- Strong grasp of 3D modelling and photorealistic rendering
Design Expertise - Extensive experience working independently as a freelance designer
- Proven ability to multi-task efficiently in a high-pressure studio environment, deliver results and meet
deadlines
- Up to date knowledge of best practice and design trends on the web
- Highly experienced in information architecture, UI and UX design
- Adept at producing realistic project timelines and budgets
- Skilled in identity design including name generation, logo design and typographic treatment
- Capable of complex problem solving via hands-on development
- People person with the ability to confidently partake and direct client meetings either in person or via
telephone/video call
Education
Sept 2012 - May 2015 Arts University Bournemouth
Bournemouth, UK BA (Hons) - Graphic Design (1st Class)
A diverse course encouraging professional design thinking & practices. I worked on a wide
array of projects ranging from typography to 3d design both independently & as part of a
team.
Key Learning Points:
- Looking to alternative fields such as product design or music for inspiration
- Learning the value of critical review and peer assessment
- Appreciation for the theoretical and academic side of design as well as the importance of design history
- Importance of time management and setting personal goals
- The ability to research, analyse and communicate through critical writing and speaking
Sept 2011 - Jun 2012 University for the Creative Arts
Maidstone, UK Foundation Diploma in Art & Design
A one year course exploring a range of creative subjects. This allowed me the time &
creative inspiration to decide which areas of art and design to pursue further as well as
gain insight from professional designers, artists and researchers.
Key Learning Points:
- Invaluable experience working in multiple areas of art & design include fashion, photography,
illustration & fine art
- Ability to specialise & direct my own learning through research & review
- Experience in preparing a cohesive body of work both for examination & exhibition
Sept 2004 - May 2011 Oakwood Park Grammar School
Maidstone, UK Various Qualifications
11 GCSEs graded A* – C including Maths and English.
3 A levels graded ABB::
- Media Studies – A
- English Literature – B
- Graphic Design – B', '2026-03-27 22:16:39.045980+01:00', NULL, 'graphic designer', '[]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO candidates (id, drive_file_id, filename, name, email, phone, summary, skills, experience, education, raw_text, created_at, updated_at, applied_job, assessment_results) VALUES (1, '1DCDAzckWzKENlHOB9L2-ztphjdIJQevo', 'graphic-design-resume.pdf', 'Aria Fields', 'ariafields@gmail.com', '555-555-5555', 'Creative and detail-oriented graphic designer with a strong background in design and web content management. Proven ability to create engaging promotional materials and manage online content effectively.', '["Typography", "Symbology", "Interactive Media Design", "Three-dimensional Design", "Package Design", "Publication Design", "Trademark Design", "Corporate identity", "Photography", "Adobe Illustrator", "Adobe Dreamweaver", "Adobe Premiere", "Adobe Photoshop", "Adobe Lightroom", "Adobe After Effects", "Atom", "Adobe InDesign", "Adobe XD"]'::jsonb, '["Freelance Designer March 20xx \u2013 Present: Designer & Web Content Manager \u2013 Kenosha, WI", "Internship, Assistant Art Director March 20xx \u2013 November 20xx: CBS 58 WDJT-TV \u2013 Milwaukee, WI", "Design Store Student Supervisor September 20xx \u2013 Present: University of Wisconsin-Parkside \u2013 Kenosha, WI", "UWP Dining Student Supervisor February 20xx \u2013 Present: University of Wisconsin-Parkside \u2013 Kenosha, WI"]'::jsonb, '["Bachelor of Arts in Graphic Design Excepted Graduation May 20xx: University of Wisconsin-Parkside, Kenosha, WI, GPA: 3.9; Dean\u2019s List 6 consecutive terms"]'::jsonb, 'Aria Fields
Kenosha, WI | 555-555-5555 | ariafields@gmail.com
www.linkedin.com/in/aria_fields
Portfolio: graphic_ariafields.com
EDUCATION
Bachelor of Arts in Graphic Design Excepted Graduation May 20xx
University of Wisconsin-Parkside, Kenosha, WI
GPA: 3.9; Dean’s List 6 consecutive terms
SKILLS
Design Skills:
Typography Symbology Interactive Media Design
Three-dimensional Design Package Design Publication Design
Trademark Design Corporate identity Photography
Programming/Scripting Languages:
Adobe Illustrator Adobe Dreamweaver Adobe Premiere
Adobe Photoshop Adobe Lightroom Adobe After Effects
Atom Adobe InDesign Adobe XD
DESIGN EXPERIENCE
Freelance Designer March 20xx – Present
Designer & Web Content Manager – Kenosha, WI
 Create flyers for print and digital distribution to customers of local businesses for
promotion.
 Manage web sites for 2 student organizations and 3 local companies ensuring accurate
content.
 Develop t-shirts designs for the UWP multiple student organizations to help promote
clubs and activities.
Internship, Assistant Art Director March 20xx – November 20xx
CBS 58 WDJT-TV – Milwaukee, WI
 Designed promotional materials for shows, events programs, met with clients, and
worked collaboratively with creative staff.
 Created T-Shirts designs for local community events in order to engage more student
involvement.
 Developed and revised the website for news station to guarantee an exciting interactive
experience for users.
ADDITIONAL EXPERIENCE
Design Store Student Supervisor September 20xx – Present
University of Wisconsin-Parkside – Kenosha, WI
.
UWP Dining Student Supervisor February 20xx – Present
University of Wisconsin-Parkside – Kenosha, WI
**NOTE: This is just an example of content required on resume.
Graphic Designers are able to show creative expression of their work/style on their resume.', '2026-03-27 22:16:25.167453+01:00', NULL, 'graphic designer', '[]'::jsonb) ON CONFLICT DO NOTHING;

-- interviews: 2 rows
INSERT INTO interviews (id, candidate_name, role, date, interview_type, status) VALUES (1, 'Wahana Prima', 'Director of Product (Gen AI)', '2026-04-11 10:25:00', 'technical', 'scheduled') ON CONFLICT DO NOTHING;
INSERT INTO interviews (id, candidate_name, role, date, interview_type, status) VALUES (2, 'Tasneem Graba', 'graphic designer', '2026-04-17 03:10:00', 'screening', 'scheduled') ON CONFLICT DO NOTHING;

-- assessments: 6 rows
INSERT INTO assessments (id, title, duration, difficulty, focus, description, job_id) VALUES (1, 'NEXUS AI Vetting Challenge', '3 Hours', 'Intermediate', '["Real-world Scenarios", "Efficiency", "Optimization"]'::jsonb, 'Automated challenge generated based on job requirements.', 1) ON CONFLICT DO NOTHING;
INSERT INTO assessments (id, title, duration, difficulty, focus, description, job_id) VALUES (2, 'NEXUS AI Vetting Challenge', '3 Hours', 'Intermediate', '["Real-world Scenarios", "Efficiency", "Optimization"]'::jsonb, 'Automated challenge generated based on job requirements.', 5) ON CONFLICT DO NOTHING;
INSERT INTO assessments (id, title, duration, difficulty, focus, description, job_id) VALUES (3, 'NEXUS AI Vetting Challenge', '3 Hours', 'Intermediate', '["Real-world Scenarios", "Efficiency", "Optimization"]'::jsonb, 'Automated challenge generated based on job requirements.', 3) ON CONFLICT DO NOTHING;
INSERT INTO assessments (id, title, duration, difficulty, focus, description, job_id) VALUES (4, 'NEXUS AI Vetting Challenge', '3 Hours', 'Intermediate', '["Real-world Scenarios", "Efficiency", "Optimization"]'::jsonb, 'Automated challenge generated based on job requirements.', 4) ON CONFLICT DO NOTHING;
INSERT INTO assessments (id, title, duration, difficulty, focus, description, job_id) VALUES (5, 'Designing a Scalable Neural Architecture for Real-Time Fraud Detection in Financial Transactions', '6 Hours', 'Intermediate', '["Neural Network Architecture Design", "Performance Optimization", "System Integration"]'::jsonb, 'In the fast-paced world of financial transactions, timely and accurate fraud detection is critical. As a Principal Neural Architect, you are tasked with designing a scalable neural network architecture to detect fraudulent transactions in real-time. The system must be capable of processing tens of thousands of transactions per second, adapting to new types of fraud as they emerge, and minimizing false positives to reduce disruption to legitimate transactions. 

Your challenge is to architect a neural network model that integrates seamlessly with existing transaction processing systems, ensuring minimal latency and high throughput. You must consider the trade-offs between complexity and performance, scalability of the architecture to accommodate growing transaction volumes, and the feasibility of integrating with other machine learning models currently in use. 

The deliverables for this assessment include a detailed architecture diagram, a technical report outlining your design choices, performance optimization strategies, and a prototype implementation of a key module of the architecture. You are expected to demonstrate best practices in neural network design, address potential integration challenges, and propose a roadmap for future enhancements. This task tests your ability to architect robust neural networks that meet real-world constraints and deliver high-performance solutions in a mission-critical environment.', 1) ON CONFLICT DO NOTHING;
INSERT INTO assessments (id, title, duration, difficulty, focus, description, job_id) VALUES (6, 'Deploy and Monitor a Simple Machine Learning Model using Docker and Prometheus', '3 Hours', 'Easy', '["Docker", "Prometheus", "MLOps"]'::jsonb, 'In this challenge, you will be tasked with deploying a simple machine learning model as a RESTful API using Docker. The purpose of this task is to evaluate your ability to containerize a machine learning application and set up basic monitoring using Prometheus. Your model can be a simple linear regression or a pre-trained model from a well-known library such as scikit-learn. You are required to create a Dockerfile to containerize the application, ensuring that it can be easily built and run on any system with Docker installed. Once the application is running, integrate Prometheus to monitor basic metrics such as request counts, response times, and resource usage. You will need to create a basic Prometheus configuration and demonstrate how to visualize these metrics on a dashboard, such as Grafana, although the dashboard setup is optional. Deliverables include a GitHub repository containing your Dockerfile, application code, Prometheus configuration, and a README file with instructions on how to build, run, and monitor the application. This task will test your understanding of containerization, deployment, and monitoring, which are fundamental skills for an MLOps Engineer.', 2) ON CONFLICT DO NOTHING;
-- assessment_submissions: 0 rows

SET session_replication_role = DEFAULT;
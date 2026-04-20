-- Principal Neural Architect
UPDATE jobs SET
  requirements = 'PhD or Masters in CS/AI. Deep expertise in Transformer architectures and LLMs. Experience with large-scale model training and distributed systems. Proficiency in PyTorch and CUDA programming. Track record of research publications or significant open-source contributions.',
  description = 'Lead the design and implementation of our next-generation neural networks. You will push the boundaries of LLM efficiency and performance, working at the intersection of theory and large-scale deployment.',
  tags = '["PyTorch", "Distributed Systems", "LLM Research", "CUDA"]'
WHERE id = 1;

-- Senior MLOps Engineer
UPDATE jobs SET
  requirements = '5+ years of experience in DevOps or MLOps. Strong proficiency in Kubernetes, Terraform, and CI/CD pipelines. Experience with ML flow, Kubeflow, or similar orchestrators. Knowledge of model monitoring and data versioning. Background in scaling production ML systems.',
  description = 'Architect and maintain the infrastructure that powers our AI models. You will be responsible for ensuring seamless deployment, monitoring, and scaling of model pipelines across multi-cloud environments.',
  tags = '["Kubernetes", "Terraform", "CI/CD", "MLOps", "Azure/AWS"]'
WHERE id = 2;

-- Director of Product (Gen AI)
UPDATE jobs SET
  requirements = 'Proven experience leading AI product teams. Strategic understanding of the Generative AI market and NLP technologies. Strong communication skills and ability to bridge technical and business requirements. Experience with agile development and product lifecycle management.',
  description = 'Define the vision and roadmap for our AI-driven features. You will collaborate with engineering and research teams to deliver impactful products that leverage state-of-the-art generative models.',
  tags = '["Product Strategy", "NLP", "Gen AI", "Leadership"]'
WHERE id = 3;

-- Final Verification
SELECT id, title, requirements, tags FROM jobs;

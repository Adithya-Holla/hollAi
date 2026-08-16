function validateProject(body) {
  const errors = [];
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    errors.push('title is required');
  }
  if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
    errors.push('description is required');
  }
  if (!Array.isArray(body.technologies) || body.technologies.length === 0) {
    errors.push('technologies must be a non-empty array');
  }
  if (!body.imageUrl || typeof body.imageUrl !== 'string') {
    errors.push('imageUrl is required');
  }
  return { valid: errors.length === 0, errors };
}

function validateCertification(body) {
  const errors = [];
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    errors.push('title is required');
  }
  if (!body.organization || typeof body.organization !== 'string' || !body.organization.trim()) {
    errors.push('organization is required');
  }
  if (!body.issueDate || isNaN(Date.parse(body.issueDate))) {
    errors.push('issueDate is required and must be a valid date');
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateProject, validateCertification };

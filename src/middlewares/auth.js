const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // Validate token logic here
    next();
  };
  
  export default authMiddleware;        

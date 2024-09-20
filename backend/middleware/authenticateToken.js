import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
  // Check if the environment is development, if so, skip authentication
  // this is done for cookie issues currently happening in local - does not put it in cookie application 
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const token = req.cookies.token;  // Retrieve JWT token from cookie

  console.log("token", token);
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err);  // Log any token verification errors
      return res.status(403).json({ message: 'Unauthorized: Invalid token' });
    }
    
    req.user = user;  // Attach the decoded user to the request object
    next();           // Proceed to the next middleware
  });
}

export default authenticateToken;

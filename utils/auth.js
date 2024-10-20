#!/usr/bin/env node

class Auth {
  static getHeader(request) {
    if (!request) return undefined;
    return request.headers.authorization;
  }

  static getBase64Header(header) {
    if (!header || typeof (header) !== 'string') return undefined;
    if (!header.startsWith('Basic ')) return undefined;
    return header.split(' ')[1];
  }

  static decodeBase64Header(header) {
    if (!header || typeof (header) !== 'string') return undefined;
    const buffer = Buffer.from(header, 'base64');
    const decoded = buffer.toString();
    return decoded;
  }

  static userCredintails(decoded) {
    if (!decoded || typeof (decoded) !== 'string') return undefined;
    if (!decoded.includes(':')) return undefined;
    const userInfo = decoded.split(':');
    const data = {
      email: userInfo.splice(0, 1)[0],
      password: userInfo.join(''),
    };
    return data;
  }

  static getUserEmailPassword(request) {
    const authHeader = this.getHeader(request);
    const encoded = this.getBase64Header(authHeader);
    const decoded = this.decodeBase64Header(encoded);
    const user = this.userCredintails(decoded);
    return user;
  }
}

export default Auth;

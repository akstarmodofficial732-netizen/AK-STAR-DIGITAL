import React, { useState, useEffect, useRef } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  X, 
  Mail, 
  Lock, 
  Shield, 
  User, 
  Sparkles, 
  AlertCircle, 
  KeyRound, 
  Phone, 
  Smartphone, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  Info 
} from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess?: (user: { uid: string; email: string; displayName?: string }) => void;
}

const COUNTRY_CODES = [
  { code: '+91', name: 'India (🇮🇳)' },
  { code: '+1', name: 'USA / Canada (🇺🇸/🇨🇦)' },
  { code: '+880', name: 'Bangladesh (🇧🇩)' },
  { code: '+92', name: 'Pakistan (🇵🇰)' },
  { code: '+971', name: 'UAE (🇦🇪)' },
  { code: '+966', name: 'Saudi Arabia (🇸🇦)' },
  { code: '+44', name: 'UK (🇬🇧)' },
  { code: '+60', name: 'Malaysia (🇲🇾)' },
];

export default function AuthModal({ onClose, onLoginSuccess }: AuthModalProps) {
  // Method Toggles: 'email' | 'phone'
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  
  // Email States
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Phone States
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneName, setPhoneName] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Existing User matching states
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [checkingExistingUser, setCheckingExistingUser] = useState(false);

  // Sandbox fallbacks
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [sandboxCode, setSandboxCode] = useState('');
  const [showSandboxOption, setShowSandboxOption] = useState(false);

  // Auto-fetch existing user name by phone number
  useEffect(() => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length >= 8) {
      const delayDebounceFn = setTimeout(async () => {
        setCheckingExistingUser(true);
        try {
          const fullPhoneNumber = `${countryCode}${cleanPhone}`;
          const targetEmail = `${fullPhoneNumber}@akstardigital.com`;
          
          const usersRef = collection(db, 'cms_users');
          const q = query(usersRef, where('email', '==', targetEmail));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            if (docData && docData.name) {
              setPhoneName(docData.name);
              setIsExistingUser(true);
            } else {
              setIsExistingUser(false);
            }
          } else {
            setIsExistingUser(false);
          }
        } catch (err) {
          console.error('Error checking existing phone user:', err);
        } finally {
          setCheckingExistingUser(false);
        }
      }, 400); // 400ms debounce
      return () => clearTimeout(delayDebounceFn);
    } else {
      setIsExistingUser(false);
      setPhoneName('');
    }
  }, [phoneNumber, countryCode]);

  // General States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // References for OTP input focus shifting
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: any;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleLocalBypass = (role: 'admin' | 'client') => {
    const mockUser = {
      uid: role === 'admin' ? 'admin-123' : 'client-123',
      email: role === 'admin' ? 'akstarmodofficial732@gmail.com' : 'demo_client@akstardigital.com',
      displayName: role === 'admin' ? 'Owner / Admin (Local Mode)' : 'Demo Client (Local Mode)'
    };
    if (onLoginSuccess) {
      onLoginSuccess(mockUser);
    }
    onClose();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up!');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters long.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Firebase Auth Error: Email/Password sign-in provider is not enabled in your Firebase console. (auth/operation-not-allowed)');
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google authentication was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Handling Functions
  const setupRecaptcha = () => {
    if (typeof window !== 'undefined' && !(window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          }
        });
      } catch (err) {
        console.error('Recaptcha initialization failed:', err);
      }
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setError('Please enter a valid mobile number (min 8 digits).');
      return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      if (!appVerifier) {
        throw new Error('reCAPTCHA verification system could not be initialized.');
      }

      const fullPhoneNumber = `${countryCode}${cleanPhone}`;
      
      // Perform actual Firebase Phone Auth call
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      setConfirmationResult(result);

      setIsOtpSent(true);
      setOtpTimer(60);
      setOtpDigits(['', '', '', '', '', '']);

      // Auto focus the first OTP input digit
      setTimeout(() => {
        if (otpRefs.current[0]) {
          otpRefs.current[0].focus();
        }
      }, 150);

    } catch (err: any) {
      console.error('Firebase sign-in with phone number failed:', err);
      let errorMsg = err.message || 'Failed to dispatch verification code to your SIM.';
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        errorMsg = 'Phone authentication is not enabled in the Firebase Console. Please go to: Firebase Console > Authentication > Sign-in Method, and enable the "Phone" sign-in provider, then try again!';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setError('');
    setLoading(true);
    try {
      if (isSandboxMode) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSandboxCode(code);
        setOtpTimer(60);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => {
          if (otpRefs.current[0]) otpRefs.current[0].focus();
        }, 150);
        return;
      }

      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      if (!appVerifier) {
        throw new Error('reCAPTCHA verification system could not be initialized.');
      }
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      const fullPhoneNumber = `${countryCode}${cleanPhone}`;
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      setConfirmationResult(result);
      setOtpTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        if (otpRefs.current[0]) otpRefs.current[0].focus();
      }, 150);
    } catch (err: any) {
      console.error('Failed to resend OTP:', err);
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = otpRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // Shift back focus
        const prevInput = otpRefs.current[index - 1];
        if (prevInput) {
          prevInput.focus();
          const newDigits = [...otpDigits];
          newDigits[index - 1] = '';
          setOtpDigits(newDigits);
        }
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const typedCode = otpDigits.join('');
    if (typedCode.length !== 6) {
      setError('Please input the complete 6-digit OTP verification code.');
      return;
    }

    setLoading(true);
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/[^0-9]/g, '')}`;
      const finalDisplayName = phoneName.trim() || `Client (${countryCode} ${phoneNumber})`;

      if (isSandboxMode) {
        if (typedCode !== sandboxCode && typedCode !== '123456') {
          throw new Error('Incorrect sandbox verification code. Please check the code displayed on your screen.');
        }

        const fakeUid = `phone-sandbox-${fullPhoneNumber}`;
        const phoneUser = {
          uid: fakeUid,
          email: `${fullPhoneNumber}@akstardigital.com`,
          displayName: finalDisplayName
        };

        // Save/sync simulated user profile to Firestore database in cms_users
        try {
          const userDocRef = doc(db, 'cms_users', fakeUid);
          const userDocSnap = await getDoc(userDocRef);
          
          const profileData = {
            uid: fakeUid,
            name: finalDisplayName,
            email: `${fullPhoneNumber}@akstardigital.com`,
            role: 'client' as const,
            status: 'active' as const
          };

          if (!userDocSnap.exists()) {
            await setDoc(userDocRef, profileData);
            console.log('Successfully saved new phone sandbox user profile in cms_users');
          } else {
            const existingData = userDocSnap.data();
            if (!existingData.name || existingData.name.startsWith('Client (')) {
              await setDoc(userDocRef, { ...existingData, name: finalDisplayName }, { merge: true });
              console.log('Successfully updated existing sandbox profile with custom name');
            }
          }
        } catch (profileErr) {
          console.error('Failed to sync sandbox user profile to cms_users:', profileErr);
        }

        if (onLoginSuccess) {
          onLoginSuccess(phoneUser);
        }
        onClose();
        return;
      }

      if (!confirmationResult) {
        throw new Error('No active verification session. Please request a new OTP.');
      }

      // Verify the code
      const result = await confirmationResult.confirm(typedCode);
      const user = result.user;

      const phoneUser = {
        uid: user.uid,
        email: user.email || `${fullPhoneNumber}@akstardigital.com`,
        displayName: finalDisplayName
      };

      // Save/sync user profile to Firestore database in cms_users
      try {
        const userDocRef = doc(db, 'cms_users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        const profileData = {
          uid: user.uid,
          name: finalDisplayName,
          email: user.email || `${fullPhoneNumber}@akstardigital.com`,
          role: 'client' as const,
          status: 'active' as const
        };

        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, profileData);
          console.log('Successfully saved new phone user profile in cms_users');
        } else {
          const existingData = userDocSnap.data();
          // Update profile if they registered previously with a placeholder name
          if (!existingData.name || existingData.name.startsWith('Client (')) {
            await setDoc(userDocRef, { ...existingData, name: finalDisplayName }, { merge: true });
            console.log('Successfully updated existing profile with custom name');
          }
        }
      } catch (profileErr) {
        console.error('Failed to sync user profile to cms_users:', profileErr);
      }

      if (onLoginSuccess) {
        onLoginSuccess(phoneUser);
      }
      onClose();
    } catch (err: any) {
      console.error('OTP verification failed:', err);
      setError(err.message || 'Incorrect verification code. Please check your SIM card SMS.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      


      <div 
        id="auth-modal-container"
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col transition-all duration-300"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1.5">
            <Shield className="w-5 h-5 text-amber-500" />
            <h3 className="font-sans font-bold text-sm text-neutral-900 dark:text-neutral-50">
              {authMethod === 'phone' 
                ? (isOtpSent ? 'OTP Verification' : 'Phone Number Login') 
                : (isSignUp ? 'Create Studio Account' : 'Verify Credentials')}
            </h3>
          </div>
          <button 
            id="close-auth-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* METHOD TABS - ONLY SHOW IF NOT CURRENTLY VERIFYING OTP */}
        {(!isOtpSent) && (
          <div className="flex border-b border-neutral-100 dark:border-neutral-800 shrink-0 bg-neutral-50/50 dark:bg-neutral-950/20 p-1 gap-1">
            <button
              id="auth-tab-email"
              onClick={() => {
                setAuthMethod('email');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all ${
                authMethod === 'email'
                  ? 'bg-white dark:bg-neutral-800 text-amber-500 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email & Password
            </button>
            <button
              id="auth-tab-phone"
              onClick={() => {
                setAuthMethod('phone');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold font-sans flex items-center justify-center gap-1.5 transition-all ${
                authMethod === 'phone'
                  ? 'bg-white dark:bg-neutral-800 text-amber-500 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile Number OTP
            </button>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-6 space-y-5 text-left text-xs overflow-y-auto max-h-[80vh]">
          
          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl flex flex-col gap-2 border border-red-100 dark:border-red-900 animate-pulse">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* FLOW A: EMAIL & PASSWORD METHOD */}
          {authMethod === 'email' && (
            <>
              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Your Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input 
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Gmail / Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input 
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@gmail.com"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1">Account Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input 
                      id="auth-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <button
                  id="auth-submit-btn"
                  type="submit"
                  className="w-full py-2.5 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 rounded-xl font-semibold shadow hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isSignUp ? (
                    'Register & Sign Up'
                  ) : (
                    'Verify & Log In'
                  )}
                </button>
              </form>

              {/* Social Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
                <span className="flex-shrink mx-4 text-neutral-400 font-mono text-4xs uppercase tracking-widest">Or Google login</span>
                <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
              </div>

              {/* Google Sign-In button */}
              <button
                id="google-login-btn"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.13C18.23 1.77 15.44 1 12.24 1 6.162 1 1.24 5.922 1.24 12s4.922 11 11 11c6.34 0 10.56-4.453 10.56-10.76 0-.724-.078-1.277-.174-1.955H12.24z" />
                </svg>
                Sign in with Google
              </button>

              {/* Toggle link */}
              <p className="text-center text-4xs text-neutral-400 mt-2 font-mono">
                {isSignUp ? 'Already have an account?' : 'New to AK STAR DIGITAL?'}
                <button
                  id="toggle-auth-mode"
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-amber-500 hover:underline font-bold ml-1 cursor-pointer"
                >
                  {isSignUp ? 'Log In' : 'Register Now'}
                </button>
              </p>
            </>
          )}

          {/* FLOW B: PHONE NUMBER & OTP METHOD */}
          {authMethod === 'phone' && (
            <>
              {!isOtpSent ? (
                /* STEP 1: Enter Phone Number */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  
                  {/* Name Input/Greeting Box */}
                  {checkingExistingUser ? (
                    <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center gap-2.5 text-neutral-500">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                      <span className="text-[11px] font-mono">Scanning registry for member history...</span>
                    </div>
                  ) : !isExistingUser ? (
                    <div>
                      <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1 font-semibold">Your Full Name (First-Time Login)</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input 
                          id="phone-auth-name"
                          type="text"
                          value={phoneName}
                          onChange={(e) => setPhoneName(e.target.value)}
                          placeholder="e.g. Ak Star"
                          className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 dark:bg-emerald-950/25 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold shrink-0">
                        ✓
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-bold text-neutral-800 dark:text-neutral-200 leading-none">Registered Member Recognized</p>
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 font-sans truncate">{phoneName}</p>
                      </div>
                    </div>
                  )}

                  {/* Phone Input with country code */}
                  <div>
                    <label className="block text-4xs font-mono text-neutral-400 uppercase mb-1 font-semibold">Enter Mobile / WhatsApp Number</label>
                    <div className="flex gap-2">
                      {/* Country Code Dropdown */}
                      <div className="relative shrink-0 w-28">
                        <select
                           id="phone-country-code"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="w-full appearance-none bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-3 pr-8 py-2.5 dark:text-white text-xs cursor-pointer focus:outline-none"
                        >
                          {COUNTRY_CODES.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.code} {item.code === '+91' ? '🇮🇳' : ''}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-[10px]">
                          ▼
                        </div>
                      </div>

                      {/* Phone text field */}
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input 
                          id="phone-number-field"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="98765 43210"
                          className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 dark:text-white font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Firebase Recaptcha Mounting Element */}
                  <div id="recaptcha-container" className="my-1"></div>

                  {/* Carrier SMS Assistance Panel */}
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80 rounded-xl flex gap-2.5 text-[11px] text-neutral-600 dark:text-neutral-400">
                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-0.5">Secure Carrier SMS Delivery</p>
                      <p className="leading-normal">A real 6-digit verification code will be dispatched directly to your mobile SIM card or WhatsApp carrier network to authenticate your session.</p>
                    </div>
                  </div>

                  <button
                    id="phone-send-otp-btn"
                    type="submit"
                    className="w-full py-2.5 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 rounded-xl font-semibold shadow hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        Send One-Time OTP
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* STEP 2: Enter OTP Code sent */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                      <Lock className="w-5 h-5" />
                    </div>
                    <p className="font-sans font-semibold text-neutral-800 dark:text-neutral-100">Verification Code Required</p>
                    <p className="text-neutral-400 text-4xs font-mono uppercase tracking-widest">
                      Sent to {countryCode} {phoneNumber}
                    </p>
                  </div>

                  {isSandboxMode && (
                    <div className="p-3 bg-amber-500/15 dark:bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs transition-all duration-300">
                      <div className="space-y-0.5 text-left">
                        <span className="block text-[9px] font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider font-bold">Sandbox Simulated Carrier</span>
                        <p className="text-neutral-700 dark:text-neutral-300 leading-tight">Your mock verification code is:</p>
                      </div>
                      <div className="px-3 py-1.5 bg-neutral-950 text-amber-400 font-mono text-sm font-bold rounded-lg border border-amber-500/30 tracking-widest animate-pulse select-all">
                        {sandboxCode}
                      </div>
                    </div>
                  )}

                  {/* 6-Digit OTP Box Grid */}
                  <div>
                    <label className="block text-center text-4xs font-mono text-neutral-400 uppercase mb-2">Enter 6-Digit Code</label>
                    <div className="flex justify-center gap-2 max-w-xs mx-auto">
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { otpRefs.current[index] = el; }}
                          id={`otp-input-${index}`}
                          type="text"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(e.target.value, index)}
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                          className="w-11 h-11 text-center text-base font-bold font-mono bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-neutral-950 dark:text-white transition-all shadow-inner"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Submit OTP verification */}
                  <button
                    id="phone-verify-otp-btn"
                    type="submit"
                    className="w-full py-2.5 bg-neutral-900 text-white dark:bg-amber-500 dark:text-neutral-950 rounded-xl font-semibold shadow hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Confirm & Complete Login'
                    )}
                  </button>

                  {/* OTP Timer Countdown / Resend Option */}
                  <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-800/60 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOtpSent(false);
                        setError('');
                      }}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 flex items-center gap-1 font-medium"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back / Edit Number
                    </button>

                    {otpTimer > 0 ? (
                      <span className="font-mono text-4xs">Resend in {otpTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-amber-500 hover:underline font-bold text-xs flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Resend Code
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}


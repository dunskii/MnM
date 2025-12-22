// ===========================================
// Meet & Greet Booking Page (Public)
// ===========================================
// Multi-step booking form for prospective parents

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enAU } from 'date-fns/locale';
import {
  useSchoolInfo,
  useSchoolInstruments,
  useCreateMeetAndGreet,
} from '../../hooks/useMeetAndGreet';
import type { InstrumentOption } from '../../api/meetAndGreet.api';

// ===========================================
// VALIDATION SCHEMA
// ===========================================

const phoneRegex = /^(\+61|0)[2-478]\d{8}$|^\+?[\d\s-]{10,15}$/;

const bookingSchema = z.object({
  // Student info
  studentFirstName: z.string().min(1, 'First name is required').max(50),
  studentLastName: z.string().min(1, 'Last name is required').max(50),
  studentAge: z.number().min(3, 'Minimum age is 3').max(99, 'Maximum age is 99'),

  // Contact 1 (Primary) - Required
  contact1Name: z.string().min(1, 'Name is required').max(100),
  contact1Email: z.string().email('Invalid email address'),
  contact1Phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  contact1Relationship: z.string().min(1, 'Relationship is required').max(50),

  // Contact 2 - Optional
  contact2Name: z.string().max(100).optional().or(z.literal('')),
  contact2Email: z.string().email().optional().or(z.literal('')),
  contact2Phone: z.string().optional().or(z.literal('')),
  contact2Relationship: z.string().max(50).optional().or(z.literal('')),

  // Emergency Contact - Required
  emergencyName: z.string().min(1, 'Name is required').max(100),
  emergencyPhone: z.string().regex(phoneRegex, 'Invalid phone number'),
  emergencyRelationship: z.string().min(1, 'Relationship is required').max(50),

  // Preferences
  instrumentId: z.string().optional().or(z.literal('')),
  preferredDateTime: z.date().optional().nullable(),
  additionalNotes: z.string().max(500).optional().or(z.literal('')),
});

type BookingFormData = z.infer<typeof bookingSchema>;

// ===========================================
// STEP CONFIGURATION
// ===========================================

const steps = [
  'Student Info',
  'Primary Contact',
  'Secondary Contact',
  'Emergency Contact',
  'Preferences',
  'Review',
];

// ===========================================
// COMPONENT
// ===========================================

export default function MeetAndGreetBookingPage() {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const navigate = useNavigate();
  const effectiveSlug = schoolSlug || 'music-n-me';

  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Fetch school info and instruments
  const { data: schoolInfo, isLoading: loadingSchool, error: schoolError } = useSchoolInfo(effectiveSlug);
  const { data: instruments } = useSchoolInstruments(effectiveSlug);

  // Form mutation
  const createMutation = useCreateMeetAndGreet();

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      studentFirstName: '',
      studentLastName: '',
      studentAge: 5,
      contact1Name: '',
      contact1Email: '',
      contact1Phone: '',
      contact1Relationship: 'Parent',
      contact2Name: '',
      contact2Email: '',
      contact2Phone: '',
      contact2Relationship: '',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelationship: '',
      instrumentId: '',
      preferredDateTime: null,
      additionalNotes: '',
    },
  });

  const formValues = watch();

  // Validate current step fields
  const validateStep = async (step: number): Promise<boolean> => {
    const fieldsByStep: (keyof BookingFormData)[][] = [
      ['studentFirstName', 'studentLastName', 'studentAge'],
      ['contact1Name', 'contact1Email', 'contact1Phone', 'contact1Relationship'],
      [], // Contact 2 is optional
      ['emergencyName', 'emergencyPhone', 'emergencyRelationship'],
      [], // Preferences are optional
      [], // Review step
    ];

    const fields = fieldsByStep[step];
    if (fields.length === 0) return true;

    const result = await trigger(fields);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(activeStep);
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!schoolInfo) return;

    try {
      await createMutation.mutateAsync({
        schoolId: schoolInfo.id,
        studentFirstName: data.studentFirstName,
        studentLastName: data.studentLastName,
        studentAge: data.studentAge,
        contact1Name: data.contact1Name,
        contact1Email: data.contact1Email,
        contact1Phone: data.contact1Phone.replace(/[\s-]/g, ''),
        contact1Relationship: data.contact1Relationship,
        contact2Name: data.contact2Name || undefined,
        contact2Email: data.contact2Email || undefined,
        contact2Phone: data.contact2Phone?.replace(/[\s-]/g, '') || undefined,
        contact2Relationship: data.contact2Relationship || undefined,
        emergencyName: data.emergencyName,
        emergencyPhone: data.emergencyPhone.replace(/[\s-]/g, ''),
        emergencyRelationship: data.emergencyRelationship,
        instrumentId: data.instrumentId || undefined,
        preferredDateTime: data.preferredDateTime?.toISOString(),
        additionalNotes: data.additionalNotes || undefined,
      });
      setSubmitted(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Loading state
  if (loadingSchool) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading...</Typography>
      </Container>
    );
  }

  // Error state
  if (schoolError || !schoolInfo) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">
          School not found or not accepting bookings. Please check the URL and try again.
        </Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/')}>
          Go Home
        </Button>
      </Container>
    );
  }

  // Success state
  if (submitted) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" color="primary" gutterBottom>
            Booking Submitted!
          </Typography>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Please check your email to verify your booking.
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            We've sent a verification link to <strong>{formValues.contact1Email}</strong>.
            Click the link in the email to confirm your meet & greet booking.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Return Home
          </Button>
        </Paper>
      </Container>
    );
  }

  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Student Info
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Student Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="studentFirstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name"
                    fullWidth
                    required
                    error={!!errors.studentFirstName}
                    helperText={errors.studentFirstName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="studentLastName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last Name"
                    fullWidth
                    required
                    error={!!errors.studentLastName}
                    helperText={errors.studentLastName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="studentAge"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Age"
                    type="number"
                    fullWidth
                    required
                    inputProps={{ min: 3, max: 99 }}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    error={!!errors.studentAge}
                    helperText={errors.studentAge?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 1: // Primary Contact
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Primary Contact
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This will be the main contact for your account.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="contact1Name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Full Name"
                    fullWidth
                    required
                    error={!!errors.contact1Name}
                    helperText={errors.contact1Name?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="contact1Relationship"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth required error={!!errors.contact1Relationship}>
                    <InputLabel>Relationship</InputLabel>
                    <Select {...field} label="Relationship">
                      <MenuItem value="Parent">Parent</MenuItem>
                      <MenuItem value="Guardian">Guardian</MenuItem>
                      <MenuItem value="Grandparent">Grandparent</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                    {errors.contact1Relationship && (
                      <FormHelperText>{errors.contact1Relationship.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="contact1Email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    required
                    error={!!errors.contact1Email}
                    helperText={errors.contact1Email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="contact1Phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone"
                    fullWidth
                    required
                    placeholder="04XX XXX XXX"
                    error={!!errors.contact1Phone}
                    helperText={errors.contact1Phone?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 2: // Secondary Contact
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Secondary Contact (Optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add another parent or guardian if applicable.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="contact2Name"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Full Name" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="contact2Relationship"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Relationship</InputLabel>
                    <Select {...field} label="Relationship">
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="Parent">Parent</MenuItem>
                      <MenuItem value="Guardian">Guardian</MenuItem>
                      <MenuItem value="Grandparent">Grandparent</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="contact2Email"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Email" type="email" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="contact2Phone"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Phone" fullWidth placeholder="04XX XXX XXX" />
                )}
              />
            </Grid>
          </Grid>
        );

      case 3: // Emergency Contact
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Emergency Contact
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Someone we can contact in case of emergency.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="emergencyName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Full Name"
                    fullWidth
                    required
                    error={!!errors.emergencyName}
                    helperText={errors.emergencyName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="emergencyRelationship"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Relationship"
                    fullWidth
                    required
                    placeholder="e.g., Aunt, Neighbor, Friend"
                    error={!!errors.emergencyRelationship}
                    helperText={errors.emergencyRelationship?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="emergencyPhone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone"
                    fullWidth
                    required
                    placeholder="04XX XXX XXX"
                    error={!!errors.emergencyPhone}
                    helperText={errors.emergencyPhone?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 4: // Preferences
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enAU}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Preferences
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="instrumentId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Instrument Interest</InputLabel>
                      <Select {...field} label="Instrument Interest">
                        <MenuItem value="">Not sure yet</MenuItem>
                        {instruments?.map((inst: InstrumentOption) => (
                          <MenuItem key={inst.id} value={inst.id}>
                            {inst.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="preferredDateTime"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label="Preferred Date & Time"
                      value={field.value}
                      onChange={field.onChange}
                      slotProps={{
                        textField: { fullWidth: true },
                      }}
                      minDate={new Date()}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="additionalNotes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Additional Notes"
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Any additional information you'd like to share..."
                      error={!!errors.additionalNotes}
                      helperText={errors.additionalNotes?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        );

      case 5: // Review
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Your Information
              </Typography>
            </Grid>

            {/* Student */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Student
                </Typography>
                <Typography>
                  {formValues.studentFirstName} {formValues.studentLastName}, {formValues.studentAge} years old
                </Typography>
              </Paper>
            </Grid>

            {/* Primary Contact */}
            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Primary Contact
                </Typography>
                <Typography>{formValues.contact1Name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formValues.contact1Relationship}
                </Typography>
                <Typography variant="body2">{formValues.contact1Email}</Typography>
                <Typography variant="body2">{formValues.contact1Phone}</Typography>
              </Paper>
            </Grid>

            {/* Secondary Contact */}
            {formValues.contact2Name && (
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Secondary Contact
                  </Typography>
                  <Typography>{formValues.contact2Name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formValues.contact2Relationship}
                  </Typography>
                  <Typography variant="body2">{formValues.contact2Email}</Typography>
                  <Typography variant="body2">{formValues.contact2Phone}</Typography>
                </Paper>
              </Grid>
            )}

            {/* Emergency Contact */}
            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Emergency Contact
                </Typography>
                <Typography>{formValues.emergencyName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {formValues.emergencyRelationship}
                </Typography>
                <Typography variant="body2">{formValues.emergencyPhone}</Typography>
              </Paper>
            </Grid>

            {/* Preferences */}
            <Grid item xs={12} sm={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Preferences
                </Typography>
                <Typography>
                  Instrument:{' '}
                  {instruments?.find((i: InstrumentOption) => i.id === formValues.instrumentId)?.name || 'Not specified'}
                </Typography>
                <Typography>
                  Preferred Time:{' '}
                  {formValues.preferredDateTime
                    ? formValues.preferredDateTime.toLocaleString('en-AU', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Flexible'}
                </Typography>
              </Paper>
            </Grid>

            {formValues.additionalNotes && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Additional Notes
                  </Typography>
                  <Typography variant="body2">{formValues.additionalNotes}</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Monkey Mayhem", "Comic Sans MS", cursive',
            color: 'primary.main',
            mb: 1,
          }}
        >
          Book a Meet & Greet
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {schoolInfo.name}
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Form */}
      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {renderStepContent(activeStep)}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Submitting...' : 'Submit Booking'}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

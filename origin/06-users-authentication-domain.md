# Dominio: Usuarios y Autenticación

## Visión del Dominio

El dominio de Usuarios y Autenticación es la base de seguridad y gestión de identidad de la plataforma Carvento, responsable de manejar el ciclo completo de vida de usuarios, desde el registro hasta la verificación y gestión de permisos. Este dominio implementa un sistema robusto de autenticación multi-factor y autorización basada en roles.

## Contexto del Negocio

### Responsabilidades Principales
- **Registro y onboarding** de nuevos usuarios
- **Autenticación multi-factor** (email/SMS)
- **Gestión de perfiles** y verificación de identidad
- **Autorización basada en roles** (RBAC)
- **Gestión de sesiones** y tokens JWT
- **Verificación de documentos** de identidad
- **Control de acceso** granular por funcionalidad
- **Auditoria de seguridad** y detección de anomalías

### Tipos de Usuario
- **Visitante**: Navegación básica sin registro
- **Cliente Registrado**: Acceso a leads y contacto con vendedores
- **Cliente Verificado**: Acceso completo a funcionalidades de compra
- **Vendedor**: Publicación de vehículos
- **Administrador**: Gestión completa de la plataforma

### Niveles de Verificación
1. **Email Verificado**: Confirmación de dirección de correo
2. **Teléfono Verificado**: Confirmación SMS
3. **Identidad Verificada**: Documento de identidad validado
4. **Pago Verificado**: Método de pago confirmado
5. **Premium Verificado**: Verificación completa para transacciones grandes

## Modelo de Dominio

### Entidades Principales

#### 1. User (Agregado Raíz)
```typescript
export class User {
  private constructor(
    public readonly id: UserId,
    private profile: UserProfile,
    private credentials: UserCredentials,
    private verification: UserVerification,
    private permissions: UserPermissions,
    private auditTrail: UserAuditTrail
  ) {}

  static register(
    email: EmailAddress,
    password: Password,
    basicProfile: BasicUserProfile
  ): User {
    const id = UserId.generate();
    const hashedPassword = Password.hash(password.value);

    const profile = UserProfile.create(basicProfile);
    const credentials = UserCredentials.create(email, hashedPassword);
    const verification = UserVerification.createUnverified();
    const permissions = UserPermissions.createDefault();
    const auditTrail = UserAuditTrail.create();

    const user = new User(id, profile, credentials, verification, permissions, auditTrail);

    user.recordEvent(new UserRegisteredEvent(id, email.value, profile.fullName));
    return user;
  }

  public authenticate(password: Password, context: AuthenticationContext): AuthenticationResult {
    // Verificar credenciales
    if (!this.credentials.verifyPassword(password)) {
      this.auditTrail.recordFailedLogin(context);
      throw new InvalidCredentialsError('Invalid email or password');
    }

    // Verificar estado de la cuenta
    if (this.verification.isLocked()) {
      throw new AccountLockedError('Account is temporarily locked');
    }

    // Verificar si requiere MFA
    if (this.verification.requiresMFA()) {
      const mfaToken = MFAToken.generate(this.id);
      this.auditTrail.recordMFARequired(context);
      return AuthenticationResult.requiresMFA(mfaToken);
    }

    // Autenticación exitosa
    this.auditTrail.recordSuccessfulLogin(context);
    const accessToken = this.generateAccessToken();
    const refreshToken = this.generateRefreshToken();

    return AuthenticationResult.success(accessToken, refreshToken);
  }

  public verifyEmail(verificationToken: EmailVerificationToken): void {
    if (!this.verification.canVerifyEmail(verificationToken)) {
      throw new InvalidVerificationTokenError('Invalid or expired verification token');
    }

    this.verification.markEmailAsVerified();
    this.recordEvent(new EmailVerifiedEvent(this.id));

    // Verificar si puede ser promovido automáticamente
    this.tryAutoPromoteRole();
  }

  public verifyPhone(verificationCode: SMSVerificationCode): void {
    if (!this.verification.canVerifyPhone(verificationCode)) {
      throw new InvalidVerificationCodeError('Invalid or expired verification code');
    }

    this.verification.markPhoneAsVerified();
    this.recordEvent(new PhoneVerifiedEvent(this.id));

    this.tryAutoPromoteRole();
  }

  public submitIdentityDocuments(documents: IdentityDocument[]): void {
    if (!this.verification.canSubmitIdentityDocuments()) {
      throw new VerificationNotAllowedError('Email and phone must be verified first');
    }

    this.verification.submitIdentityDocuments(documents);
    this.recordEvent(new IdentityDocumentsSubmittedEvent(this.id, documents.length));
  }

  public updateProfile(profileUpdate: UserProfileUpdate): void {
    const updatedProfile = this.profile.update(profileUpdate);
    const changes = this.profile.getChanges(updatedProfile);

    this.profile = updatedProfile;
    this.auditTrail.recordProfileUpdate(changes);

    this.recordEvent(new ProfileUpdatedEvent(this.id, changes));
  }

  public grantRole(role: UserRole, grantedBy: UserId): void {
    if (!this.permissions.canBeGrantedRole(role)) {
      throw new InsufficientVerificationError(
        `User must complete ${role.getRequiredVerificationLevel()} verification first`
      );
    }

    this.permissions.grantRole(role);
    this.auditTrail.recordRoleGranted(role, grantedBy);

    this.recordEvent(new RoleGrantedEvent(this.id, role, grantedBy));
  }

  public hasPermission(permission: Permission): boolean {
    return this.permissions.hasPermission(permission);
  }

  public canCreateLeads(): boolean {
    return this.verification.isEmailVerified() &&
           this.permissions.hasRole(UserRole.CUSTOMER);
  }

  public canContactSellers(): boolean {
    return this.verification.isEmailVerified() &&
           this.verification.isPhoneVerified() &&
           this.permissions.hasRole(UserRole.VERIFIED_CUSTOMER);
  }

  public lockAccount(reason: string, lockedBy: UserId): void {
    this.verification.lockAccount(reason);
    this.auditTrail.recordAccountLocked(reason, lockedBy);

    this.recordEvent(new AccountLockedEvent(this.id, reason, lockedBy));
  }

  private tryAutoPromoteRole(): void {
    if (this.verification.isEmailVerified() &&
        !this.permissions.hasRole(UserRole.CUSTOMER)) {
      this.permissions.grantRole(UserRole.CUSTOMER);
      this.recordEvent(new AutoPromotedEvent(this.id, UserRole.CUSTOMER));
    }

    if (this.verification.isEmailVerified() &&
        this.verification.isPhoneVerified() &&
        !this.permissions.hasRole(UserRole.VERIFIED_CUSTOMER)) {
      this.permissions.grantRole(UserRole.VERIFIED_CUSTOMER);
      this.recordEvent(new AutoPromotedEvent(this.id, UserRole.VERIFIED_CUSTOMER));
    }
  }

  private generateAccessToken(): AccessToken {
    return AccessToken.create(
      this.id,
      this.permissions.getRoles(),
      this.permissions.getPermissions(),
      TokenDuration.fromMinutes(15) // 15 minutos
    );
  }

  private generateRefreshToken(): RefreshToken {
    return RefreshToken.create(
      this.id,
      TokenDuration.fromDays(7) // 7 días
    );
  }
}
```

#### 2. Value Objects

**UserProfile**:
```typescript
export class UserProfile {
  constructor(
    public readonly personalInfo: PersonalInfo,
    public readonly contactInfo: ContactInfo,
    public readonly preferences: UserPreferences,
    public readonly avatar: AvatarInfo | null = null
  ) {}

  static create(basicProfile: BasicUserProfile): UserProfile {
    const personalInfo = new PersonalInfo(
      basicProfile.firstName,
      basicProfile.lastName,
      basicProfile.dateOfBirth
    );

    const contactInfo = new ContactInfo(
      basicProfile.email,
      basicProfile.phone,
      basicProfile.address
    );

    const preferences = UserPreferences.createDefault();

    return new UserProfile(personalInfo, contactInfo, preferences);
  }

  public update(update: UserProfileUpdate): UserProfile {
    const updatedPersonalInfo = this.personalInfo.update(update.personalInfo);
    const updatedContactInfo = this.contactInfo.update(update.contactInfo);
    const updatedPreferences = this.preferences.update(update.preferences);

    return new UserProfile(
      updatedPersonalInfo,
      updatedContactInfo,
      updatedPreferences,
      update.avatar || this.avatar
    );
  }

  public getChanges(other: UserProfile): ProfileChange[] {
    const changes: ProfileChange[] = [];

    if (!this.personalInfo.equals(other.personalInfo)) {
      changes.push(new ProfileChange('personalInfo', this.personalInfo, other.personalInfo));
    }

    if (!this.contactInfo.equals(other.contactInfo)) {
      changes.push(new ProfileChange('contactInfo', this.contactInfo, other.contactInfo));
    }

    return changes;
  }

  public get fullName(): string {
    return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
  }

  public isComplete(): boolean {
    return this.personalInfo.isComplete() &&
           this.contactInfo.isComplete();
  }
}
```

**UserVerification**:
```typescript
export class UserVerification {
  private constructor(
    private emailVerification: EmailVerification,
    private phoneVerification: PhoneVerification,
    private identityVerification: IdentityVerification,
    private paymentVerification: PaymentVerification,
    private accountStatus: AccountStatus
  ) {}

  static createUnverified(): UserVerification {
    return new UserVerification(
      EmailVerification.createUnverified(),
      PhoneVerification.createUnverified(),
      IdentityVerification.createUnverified(),
      PaymentVerification.createUnverified(),
      AccountStatus.active()
    );
  }

  public requiresMFA(): boolean {
    // MFA requerido para usuarios con verificación de identidad
    return this.identityVerification.isVerified() ||
           this.paymentVerification.isVerified();
  }

  public getVerificationLevel(): VerificationLevel {
    if (this.paymentVerification.isVerified()) {
      return VerificationLevel.PAYMENT_VERIFIED;
    }
    if (this.identityVerification.isVerified()) {
      return VerificationLevel.IDENTITY_VERIFIED;
    }
    if (this.phoneVerification.isVerified()) {
      return VerificationLevel.PHONE_VERIFIED;
    }
    if (this.emailVerification.isVerified()) {
      return VerificationLevel.EMAIL_VERIFIED;
    }
    return VerificationLevel.NONE;
  }

  public canVerifyEmail(token: EmailVerificationToken): boolean {
    return this.emailVerification.canVerify(token) &&
           this.accountStatus.isActive();
  }

  public markEmailAsVerified(): void {
    this.emailVerification = this.emailVerification.markAsVerified();
  }

  public canVerifyPhone(code: SMSVerificationCode): boolean {
    return this.phoneVerification.canVerify(code) &&
           this.accountStatus.isActive();
  }

  public markPhoneAsVerified(): void {
    this.phoneVerification = this.phoneVerification.markAsVerified();
  }

  public canSubmitIdentityDocuments(): boolean {
    return this.emailVerification.isVerified() &&
           this.phoneVerification.isVerified() &&
           this.accountStatus.isActive();
  }

  public submitIdentityDocuments(documents: IdentityDocument[]): void {
    this.identityVerification = this.identityVerification.submitDocuments(documents);
  }

  public isLocked(): boolean {
    return this.accountStatus.isLocked();
  }

  public lockAccount(reason: string): void {
    this.accountStatus = this.accountStatus.lock(reason);
  }

  public unlockAccount(): void {
    this.accountStatus = this.accountStatus.unlock();
  }

  // Métodos de verificación de estado
  public isEmailVerified(): boolean {
    return this.emailVerification.isVerified();
  }

  public isPhoneVerified(): boolean {
    return this.phoneVerification.isVerified();
  }

  public isIdentityVerified(): boolean {
    return this.identityVerification.isVerified();
  }

  public isPaymentVerified(): boolean {
    return this.paymentVerification.isVerified();
  }
}
```

**UserPermissions (RBAC)**:
```typescript
export class UserPermissions {
  private constructor(
    private roles: Set<UserRole>,
    private permissions: Set<Permission>,
    private restrictions: Set<Restriction>
  ) {}

  static createDefault(): UserPermissions {
    return new UserPermissions(
      new Set([UserRole.VISITOR]),
      new Set([
        Permission.VIEW_VEHICLES,
        Permission.BROWSE_MARKETPLACE
      ]),
      new Set()
    );
  }

  public grantRole(role: UserRole): void {
    this.roles.add(role);

    // Agregar permisos implícitos del rol
    const rolePermissions = role.getImplicitPermissions();
    rolePermissions.forEach(permission => this.permissions.add(permission));
  }

  public revokeRole(role: UserRole): void {
    this.roles.delete(role);

    // Recalcular permisos basado en roles restantes
    this.recalculatePermissions();
  }

  public grantPermission(permission: Permission): void {
    this.permissions.add(permission);
  }

  public revokePermission(permission: Permission): void {
    this.permissions.delete(permission);
  }

  public hasRole(role: UserRole): boolean {
    return this.roles.has(role);
  }

  public hasPermission(permission: Permission): boolean {
    if (this.restrictions.has(Restriction.fromPermission(permission))) {
      return false;
    }

    return this.permissions.has(permission);
  }

  public canBeGrantedRole(role: UserRole): boolean {
    const requiredLevel = role.getRequiredVerificationLevel();
    // Esta verificación se hace en el User entity que tiene acceso a UserVerification
    return true; // La validación real se hace en User.grantRole()
  }

  public getRoles(): UserRole[] {
    return Array.from(this.roles);
  }

  public getPermissions(): Permission[] {
    return Array.from(this.permissions);
  }

  private recalculatePermissions(): void {
    this.permissions.clear();

    // Agregar permisos de todos los roles actuales
    this.roles.forEach(role => {
      const rolePermissions = role.getImplicitPermissions();
      rolePermissions.forEach(permission => this.permissions.add(permission));
    });
  }
}
```

### Enumeraciones y Constantes

**UserRole**:
```typescript
export enum UserRole {
  VISITOR = 'visitor',
  CUSTOMER = 'customer',
  VERIFIED_CUSTOMER = 'verified_customer',
  SELLER = 'seller',
  PREMIUM_SELLER = 'premium_seller',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export class UserRoleConfig {
  private static readonly ROLE_CONFIGS = new Map<UserRole, RoleConfiguration>([
    [UserRole.VISITOR, {
      requiredVerificationLevel: VerificationLevel.NONE,
      implicitPermissions: [Permission.VIEW_VEHICLES, Permission.BROWSE_MARKETPLACE]
    }],
    [UserRole.CUSTOMER, {
      requiredVerificationLevel: VerificationLevel.EMAIL_VERIFIED,
      implicitPermissions: [
        Permission.VIEW_VEHICLES,
        Permission.BROWSE_MARKETPLACE,
        Permission.CREATE_LEADS,
        Permission.VIEW_OWN_PROFILE,
        Permission.EDIT_OWN_PROFILE
      ]
    }],
    [UserRole.VERIFIED_CUSTOMER, {
      requiredVerificationLevel: VerificationLevel.PHONE_VERIFIED,
      implicitPermissions: [
        ...UserRoleConfig.getConfig(UserRole.CUSTOMER).implicitPermissions,
        Permission.CONTACT_SELLERS,
        Permission.SCHEDULE_TEST_DRIVES,
        Permission.RESERVE_VEHICLES
      ]
    }],
    [UserRole.SELLER, {
      requiredVerificationLevel: VerificationLevel.IDENTITY_VERIFIED,
      implicitPermissions: [
        ...UserRoleConfig.getConfig(UserRole.VERIFIED_CUSTOMER).implicitPermissions,
        Permission.CREATE_VEHICLE_LISTINGS,
        Permission.MANAGE_OWN_LISTINGS,
        Permission.MANAGE_LEADS
      ]
    }],
    [UserRole.ADMIN, {
      requiredVerificationLevel: VerificationLevel.IDENTITY_VERIFIED,
      implicitPermissions: [
        Permission.MANAGE_ALL_VEHICLES,
        Permission.MANAGE_USERS,
        Permission.VIEW_ADMIN_DASHBOARD,
        Permission.GENERATE_REPORTS,
        Permission.MANAGE_ALL_LEADS
      ]
    }]
  ]);

  static getConfig(role: UserRole): RoleConfiguration {
    return this.ROLE_CONFIGS.get(role) || this.ROLE_CONFIGS.get(UserRole.VISITOR)!;
  }
}

export enum Permission {
  // Vehículos
  VIEW_VEHICLES = 'vehicle:view',
  CREATE_VEHICLE_LISTINGS = 'vehicle:create',
  MANAGE_OWN_LISTINGS = 'vehicle:manage_own',
  MANAGE_ALL_VEHICLES = 'vehicle:manage_all',
  RESERVE_VEHICLES = 'vehicle:reserve',

  // Marketplace
  BROWSE_MARKETPLACE = 'marketplace:browse',
  CREATE_LEADS = 'lead:create',
  CONTACT_SELLERS = 'lead:contact_sellers',
  SCHEDULE_TEST_DRIVES = 'lead:schedule_test_drives',
  MANAGE_LEADS = 'lead:manage_own',
  MANAGE_ALL_LEADS = 'lead:manage_all',

  // Usuarios
  VIEW_OWN_PROFILE = 'user:view_own',
  EDIT_OWN_PROFILE = 'user:edit_own',
  MANAGE_USERS = 'user:manage_all',

  // Sistema
  VIEW_ADMIN_DASHBOARD = 'system:admin_dashboard',
  GENERATE_REPORTS = 'system:reports',
  MANAGE_SYSTEM_CONFIG = 'system:config',

  // Historial
  VIEW_LEAD_HISTORY = 'history:lead_view',
  VIEW_TRANSACTION_HISTORY = 'history:transaction_view'
}
```

## Domain Services

### AuthenticationService
```typescript
@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly mfaService: MFAService,
    private readonly sessionManager: SessionManager,
    private readonly securityAuditService: SecurityAuditService
  ) {}

  async authenticate(
    email: string,
    password: string,
    context: AuthenticationContext
  ): Promise<AuthenticationResult> {
    // 1. Buscar usuario
    const user = await this.userRepository.findByEmail(new EmailAddress(email));
    if (!user) {
      await this.recordFailedAttempt(email, context, 'user_not_found');
      throw new InvalidCredentialsError('Invalid email or password');
    }

    // 2. Verificar rate limiting
    await this.checkRateLimit(user.id, context.ipAddress);

    // 3. Autenticar
    try {
      const result = user.authenticate(new Password(password), context);

      // 4. Manejar MFA si es requerido
      if (result.requiresMFA) {
        await this.initiateMFA(user, result.mfaToken, context);
      }

      // 5. Crear sesión si es exitoso
      if (result.isSuccess) {
        await this.sessionManager.createSession(user.id, result.accessToken, context);
      }

      return result;
    } catch (error) {
      await this.handleAuthenticationError(user.id, error, context);
      throw error;
    }
  }

  async completeMFA(
    mfaToken: string,
    verificationCode: string,
    context: AuthenticationContext
  ): Promise<AuthenticationResult> {
    // 1. Validar token MFA
    const mfaSession = await this.mfaService.validateToken(mfaToken);
    if (!mfaSession) {
      throw new InvalidMFATokenError('Invalid or expired MFA token');
    }

    // 2. Verificar código
    const isValidCode = await this.mfaService.verifyCode(
      mfaSession.userId,
      verificationCode,
      mfaSession.method
    );

    if (!isValidCode) {
      await this.mfaService.recordFailedAttempt(mfaSession.userId);
      throw new InvalidMFACodeError('Invalid verification code');
    }

    // 3. Obtener usuario y completar autenticación
    const user = await this.userRepository.findById(mfaSession.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // 4. Generar tokens finales
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // 5. Crear sesión
    await this.sessionManager.createSession(user.id, accessToken, context);

    return AuthenticationResult.success(accessToken, refreshToken);
  }

  async refreshToken(refreshToken: string): Promise<AuthenticationResult> {
    // 1. Validar refresh token
    const tokenData = await this.validateRefreshToken(refreshToken);
    if (!tokenData) {
      throw new InvalidRefreshTokenError('Invalid or expired refresh token');
    }

    // 2. Obtener usuario
    const user = await this.userRepository.findById(tokenData.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // 3. Generar nuevo access token
    const newAccessToken = user.generateAccessToken();

    return AuthenticationResult.tokenRefreshed(newAccessToken);
  }

  private async initiateMFA(
    user: User,
    mfaToken: MFAToken,
    context: AuthenticationContext
  ): Promise<void> {
    // Determinar método MFA preferido
    const mfaMethod = this.determineMFAMethod(user);

    // Enviar código de verificación
    switch (mfaMethod) {
      case MFAMethod.SMS:
        await this.mfaService.sendSMSCode(user.id, user.profile.contactInfo.phone);
        break;
      case MFAMethod.EMAIL:
        await this.mfaService.sendEmailCode(user.id, user.profile.contactInfo.email);
        break;
    }

    // Registrar inicio de MFA
    await this.securityAuditService.recordMFAInitiated(user.id, mfaMethod, context);
  }

  private async checkRateLimit(userId: UserId, ipAddress: string): Promise<void> {
    const attempts = await this.securityAuditService.getRecentFailedAttempts(userId, ipAddress);

    if (attempts.length >= 5) { // 5 intentos fallidos
      const lastAttempt = attempts[0];
      const lockoutDuration = this.calculateLockoutDuration(attempts.length);

      if (Date.now() - lastAttempt.timestamp.getTime() < lockoutDuration) {
        throw new RateLimitExceededError('Too many failed attempts. Please try again later.');
      }
    }
  }

  private calculateLockoutDuration(attemptCount: number): number {
    // Backoff exponencial: 1min, 5min, 15min, 30min, 1hr
    const baseMinutes = Math.min(Math.pow(5, attemptCount - 5), 60);
    return baseMinutes * 60 * 1000; // Convertir a millisegundos
  }
}
```

### UserRegistrationService
```typescript
@Injectable()
export class UserRegistrationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly smsService: SMSService,
    private readonly domainValidator: DomainValidationService
  ) {}

  async registerUser(registrationData: UserRegistrationData): Promise<User> {
    // 1. Validar datos de registro
    await this.validateRegistrationData(registrationData);

    // 2. Verificar que email no existe
    const existingUser = await this.userRepository.findByEmail(
      new EmailAddress(registrationData.email)
    );

    if (existingUser) {
      throw new EmailAlreadyExistsError('Email is already registered');
    }

    // 3. Crear usuario
    const user = User.register(
      new EmailAddress(registrationData.email),
      new Password(registrationData.password),
      {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        dateOfBirth: registrationData.dateOfBirth,
        email: registrationData.email,
        phone: registrationData.phone,
        address: registrationData.address
      }
    );

    // 4. Guardar usuario
    await this.userRepository.save(user);

    // 5. Enviar email de verificación
    await this.sendEmailVerification(user);

    // 6. Si se proporciona teléfono, enviar SMS de verificación
    if (registrationData.phone) {
      await this.sendPhoneVerification(user);
    }

    return user;
  }

  private async validateRegistrationData(data: UserRegistrationData): Promise<void> {
    const errors: ValidationError[] = [];

    // Validar email
    if (!EmailAddress.isValid(data.email)) {
      errors.push(new ValidationError('Invalid email format'));
    }

    // Validar contraseña
    const passwordValidation = Password.validate(data.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    // Validar teléfono si se proporciona
    if (data.phone && !PhoneNumber.isValid(data.phone)) {
      errors.push(new ValidationError('Invalid phone number format'));
    }

    // Validar edad mínima
    const age = this.calculateAge(data.dateOfBirth);
    if (age < 18) {
      errors.push(new ValidationError('Must be at least 18 years old'));
    }

    if (errors.length > 0) {
      throw new ValidationException(errors);
    }
  }

  private async sendEmailVerification(user: User): Promise<void> {
    const verificationToken = EmailVerificationToken.generate(user.id);

    await this.emailService.sendEmailVerification({
      to: user.profile.contactInfo.email.value,
      token: verificationToken.value,
      userName: user.profile.fullName
    });
  }

  private async sendPhoneVerification(user: User): Promise<void> {
    const verificationCode = SMSVerificationCode.generate(user.id);

    await this.smsService.sendVerificationCode({
      to: user.profile.contactInfo.phone.value,
      code: verificationCode.value,
      userName: user.profile.personalInfo.firstName
    });
  }
}
```

### VerificationService
```typescript
@Injectable()
export class VerificationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly documentAnalysisService: DocumentAnalysisService,
    private readonly identityVerificationService: IdentityVerificationService,
    private readonly s3Service: S3Service
  ) {}

  async verifyIdentityDocuments(
    userId: UserId,
    documents: IdentityDocumentUpload[]
  ): Promise<VerificationResult> {
    // 1. Obtener usuario
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // 2. Validar que puede someter documentos
    if (!user.verification.canSubmitIdentityDocuments()) {
      throw new VerificationNotAllowedError('Complete email and phone verification first');
    }

    // 3. Procesar y almacenar documentos
    const processedDocuments: IdentityDocument[] = [];

    for (const upload of documents) {
      // Subir a S3 con encriptación
      const s3Key = await this.s3Service.uploadSecureDocument(upload.file, {
        bucket: 'carvento-identity-documents',
        folder: `users/${userId.value}/identity`,
        encryption: true
      });

      // Crear documento de identidad
      const document = new IdentityDocument(
        IdentityDocumentId.generate(),
        userId,
        upload.documentType,
        s3Key,
        upload.file.originalname,
        upload.file.size,
        new Date()
      );

      processedDocuments.push(document);
    }

    // 4. Someter documentos para verificación
    user.submitIdentityDocuments(processedDocuments);

    // 5. Iniciar análisis automático
    const analysisResults = await this.analyzeDocuments(processedDocuments);

    // 6. Determinar si requiere revisión manual
    const requiresManualReview = analysisResults.some(result =>
      result.confidence < 0.85 || result.hasAnomalies
    );

    // 7. Crear resultado de verificación
    const verificationResult = new VerificationResult(
      userId,
      processedDocuments,
      analysisResults,
      requiresManualReview ? VerificationStatus.PENDING_MANUAL_REVIEW : VerificationStatus.AUTO_APPROVED,
      new Date()
    );

    // 8. Si es auto-aprobado, marcar como verificado
    if (!requiresManualReview) {
      await this.approveIdentityVerification(user, verificationResult);
    }

    // 9. Guardar cambios
    await this.userRepository.save(user);

    return verificationResult;
  }

  private async analyzeDocuments(
    documents: IdentityDocument[]
  ): Promise<DocumentAnalysisResult[]> {
    const analysisPromises = documents.map(async (document) => {
      // Análisis de documento usando AI/ML
      const analysis = await this.documentAnalysisService.analyzeDocument({
        documentId: document.id.value,
        documentType: document.type,
        s3Key: document.s3Key
      });

      return new DocumentAnalysisResult(
        document.id,
        analysis.isValid,
        analysis.confidence,
        analysis.extractedData,
        analysis.anomalies,
        analysis.riskFactors
      );
    });

    return Promise.all(analysisPromises);
  }

  private async approveIdentityVerification(
    user: User,
    verificationResult: VerificationResult
  ): Promise<void> {
    // Marcar verificación de identidad como aprobada
    user.verification.markIdentityAsVerified();

    // Auto-promover rol si es elegible
    if (user.verification.getVerificationLevel() >= VerificationLevel.IDENTITY_VERIFIED) {
      user.grantRole(UserRole.SELLER, SystemUserId.SYSTEM);
    }

    // Registrar evento
    user.recordEvent(new IdentityVerificationApprovedEvent(
      user.id,
      verificationResult.id,
      new Date()
    ));
  }

  async approveManualVerification(
    userId: UserId,
    verificationId: VerificationId,
    approvedBy: UserId,
    notes?: string
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Marcar como verificado manualmente
    user.verification.approveManualVerification(verificationId, approvedBy, notes);

    // Auto-promover rol
    user.grantRole(UserRole.SELLER, approvedBy);

    // Guardar cambios
    await this.userRepository.save(user);

    // Notificar al usuario
    await this.notifyVerificationApproved(user);
  }
}
```

## API Endpoints

### Controlador de Autenticación
```typescript
@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly registrationService: UserRegistrationService,
    private readonly verificationService: VerificationService
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async register(@Body() registerDto: RegisterUserDto): Promise<UserResponseDto> {
    const user = await this.registrationService.registerUser(registerDto);
    return UserResponseDto.fromDomain(user);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user' })
  @ApiResponse({ status: 200, type: AuthenticationResponseDto })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ): Promise<AuthenticationResponseDto> {
    const context = new AuthenticationContext(ipAddress, userAgent);

    const result = await this.authService.authenticate(
      loginDto.email,
      loginDto.password,
      context
    );

    return AuthenticationResponseDto.fromDomain(result);
  }

  @Post('mfa/verify')
  @ApiOperation({ summary: 'Verify MFA code' })
  async verifyMFA(
    @Body() mfaDto: VerifyMFADto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string
  ): Promise<AuthenticationResponseDto> {
    const context = new AuthenticationContext(ipAddress, userAgent);

    const result = await this.authService.completeMFA(
      mfaDto.mfaToken,
      mfaDto.verificationCode,
      context
    );

    return AuthenticationResponseDto.fromDomain(result);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body() refreshDto: RefreshTokenDto): Promise<AuthenticationResponseDto> {
    const result = await this.authService.refreshToken(refreshDto.refreshToken);
    return AuthenticationResponseDto.fromDomain(result);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Request() req): Promise<void> {
    await this.authService.logout(req.user.id, req.token);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  async verifyEmail(@Body() verifyDto: VerifyEmailDto): Promise<void> {
    await this.verificationService.verifyEmail(
      verifyDto.token,
      verifyDto.verificationCode
    );
  }

  @Post('verify-phone')
  @ApiOperation({ summary: 'Verify phone number' })
  async verifyPhone(@Body() verifyDto: VerifyPhoneDto): Promise<void> {
    await this.verificationService.verifyPhone(
      verifyDto.userId,
      verifyDto.verificationCode
    );
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Initiate password reset' })
  async forgotPassword(@Body() forgotDto: ForgotPasswordDto): Promise<void> {
    await this.authService.initiatePasswordReset(forgotDto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() resetDto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(
      resetDto.token,
      resetDto.newPassword
    );
  }
}
```

### Controlador de Usuarios
```typescript
@Controller('users')
@ApiTags('Users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req): Promise<UserProfileDto> {
    const query = new GetUserProfileQuery(req.user.id);
    return await this.queryBus.execute(query);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @Request() req,
    @Body() updateDto: UpdateProfileDto
  ): Promise<UserProfileDto> {
    const command = new UpdateUserProfileCommand(req.user.id, updateDto);
    await this.commandBus.execute(command);

    const query = new GetUserProfileQuery(req.user.id);
    return await this.queryBus.execute(query);
  }

  @Post('verification/identity')
  @UseInterceptors(FilesInterceptor('documents'))
  @ApiOperation({ summary: 'Submit identity documents for verification' })
  async submitIdentityDocuments(
    @Request() req,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<VerificationResultDto> {
    const command = new SubmitIdentityDocumentsCommand(req.user.id, files);
    const result = await this.commandBus.execute(command);
    return VerificationResultDto.fromDomain(result);
  }

  @Get('verification/status')
  @ApiOperation({ summary: 'Get verification status' })
  async getVerificationStatus(@Request() req): Promise<VerificationStatusDto> {
    const query = new GetVerificationStatusQuery(req.user.id);
    return await this.queryBus.execute(query);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload user avatar' })
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File
  ): Promise<AvatarResponseDto> {
    const command = new UploadAvatarCommand(req.user.id, file);
    return await this.commandBus.execute(command);
  }

  @Get('security/sessions')
  @ApiOperation({ summary: 'Get active sessions' })
  async getActiveSessions(@Request() req): Promise<SessionListDto> {
    const query = new GetActiveSessionsQuery(req.user.id);
    return await this.queryBus.execute(query);
  }

  @Delete('security/sessions/:sessionId')
  @ApiOperation({ summary: 'Terminate session' })
  async terminateSession(
    @Request() req,
    @Param('sessionId') sessionId: string
  ): Promise<void> {
    const command = new TerminateSessionCommand(req.user.id, sessionId);
    await this.commandBus.execute(command);
  }
}
```

## Esquema de Base de Datos

```sql
-- Tabla principal de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status user_status_enum NOT NULL DEFAULT 'active',

    -- Información personal
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(20),

    -- Información de contacto
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2), -- ISO country code

    -- Avatar
    avatar_url VARCHAR(500),

    -- Preferencias
    preferred_language VARCHAR(5) DEFAULT 'es',
    timezone VARCHAR(50) DEFAULT 'America/Bogota',
    notification_preferences JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMP,

    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_age CHECK (date_of_birth IS NULL OR date_of_birth <= NOW() - INTERVAL '18 years')
);

CREATE TYPE user_status_enum AS ENUM (
    'active',
    'locked',
    'suspended',
    'deleted'
);

-- Tabla de verificaciones
CREATE TABLE user_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Verificación de email
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    email_verification_token VARCHAR(255),
    email_token_expires_at TIMESTAMP,

    -- Verificación de teléfono
    phone_verified BOOLEAN DEFAULT FALSE,
    phone_verified_at TIMESTAMP,
    phone_verification_code VARCHAR(10),
    phone_code_expires_at TIMESTAMP,
    phone_verification_attempts INTEGER DEFAULT 0,

    -- Verificación de identidad
    identity_verified BOOLEAN DEFAULT FALSE,
    identity_verified_at TIMESTAMP,
    identity_verification_level verification_level_enum DEFAULT 'none',

    -- Verificación de pago
    payment_verified BOOLEAN DEFAULT FALSE,
    payment_verified_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(user_id)
);

CREATE TYPE verification_level_enum AS ENUM (
    'none',
    'email_verified',
    'phone_verified',
    'identity_verified',
    'payment_verified'
);

-- Tabla de roles de usuario
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role role_enum NOT NULL,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP,

    UNIQUE(user_id, role) WHERE revoked_at IS NULL
);

CREATE TYPE role_enum AS ENUM (
    'visitor',
    'customer',
    'verified_customer',
    'seller',
    'premium_seller',
    'admin',
    'super_admin'
);

-- Tabla de permisos específicos
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission permission_enum NOT NULL,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,

    UNIQUE(user_id, permission) WHERE expires_at IS NULL OR expires_at > NOW()
);

CREATE TYPE permission_enum AS ENUM (
    'vehicle:view',
    'vehicle:create',
    'vehicle:manage_own',
    'vehicle:manage_all',
    'vehicle:reserve',
    'marketplace:browse',
    'lead:create',
    'lead:contact_sellers',
    'lead:schedule_test_drives',
    'lead:manage_own',
    'lead:manage_all',
    'user:view_own',
    'user:edit_own',
    'user:manage_all',
    'system:admin_dashboard',
    'system:reports',
    'system:config',
    'history:lead_view',
    'history:transaction_view'
);

-- Tabla de documentos de identidad
CREATE TABLE identity_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type identity_document_type_enum NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,

    -- Estado de verificación
    verification_status document_verification_status_enum DEFAULT 'pending',
    verified_at TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    verification_notes TEXT,

    -- Análisis automático
    ai_analysis_result JSONB,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00

    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE identity_document_type_enum AS ENUM (
    'national_id',
    'passport',
    'drivers_license',
    'utility_bill',
    'bank_statement',
    'other'
);

CREATE TYPE document_verification_status_enum AS ENUM (
    'pending',
    'in_review',
    'approved',
    'rejected',
    'expired'
);

-- Tabla de sesiones activas
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,

    -- Información de la sesión
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),

    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(refresh_token_hash)
);

-- Tabla de auditoría de seguridad
CREATE TABLE security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_type security_event_type_enum NOT NULL,
    event_details JSONB NOT NULL,

    -- Contexto
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE security_event_type_enum AS ENUM (
    'login_attempt',
    'login_success',
    'login_failure',
    'mfa_required',
    'mfa_success',
    'mfa_failure',
    'password_reset_requested',
    'password_reset_completed',
    'account_locked',
    'account_unlocked',
    'role_granted',
    'role_revoked',
    'permission_granted',
    'permission_revoked',
    'profile_updated',
    'verification_submitted',
    'verification_approved',
    'verification_rejected'
);

-- Índices para optimización
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_created ON users (created_at);

CREATE INDEX idx_user_verifications_user ON user_verifications (user_id);
CREATE INDEX idx_user_verifications_levels ON user_verifications (email_verified, phone_verified, identity_verified);

CREATE INDEX idx_user_roles_user ON user_roles (user_id);
CREATE INDEX idx_user_roles_active ON user_roles (user_id, role) WHERE revoked_at IS NULL;

CREATE INDEX idx_user_permissions_user ON user_permissions (user_id);
CREATE INDEX idx_user_permissions_active ON user_permissions (user_id, permission)
    WHERE expires_at IS NULL OR expires_at > NOW();

CREATE INDEX idx_identity_documents_user ON identity_documents (user_id);
CREATE INDEX idx_identity_documents_status ON identity_documents (verification_status);

CREATE INDEX idx_user_sessions_user ON user_sessions (user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions (user_id, is_active, expires_at);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions (refresh_token_hash);

CREATE INDEX idx_security_audit_user ON security_audit_log (user_id);
CREATE INDEX idx_security_audit_event ON security_audit_log (event_type, created_at);
CREATE INDEX idx_security_audit_ip ON security_audit_log (ip_address, created_at);

-- Triggers para auditoría automática
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO security_audit_log (user_id, event_type, event_details, success)
        VALUES (
            NEW.id,
            'profile_updated',
            jsonb_build_object(
                'changed_fields', (
                    SELECT jsonb_object_agg(key, value)
                    FROM jsonb_each(to_jsonb(NEW))
                    WHERE value != (to_jsonb(OLD) -> key)
                )
            ),
            TRUE
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_user_changes
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_user_changes();

-- Vista para permisos efectivos del usuario
CREATE VIEW user_effective_permissions AS
WITH role_permissions AS (
    SELECT
        ur.user_id,
        ur.role,
        unnest(CASE ur.role
            WHEN 'visitor' THEN ARRAY['vehicle:view', 'marketplace:browse']
            WHEN 'customer' THEN ARRAY['vehicle:view', 'marketplace:browse', 'lead:create', 'user:view_own', 'user:edit_own']
            WHEN 'verified_customer' THEN ARRAY['vehicle:view', 'marketplace:browse', 'lead:create', 'lead:contact_sellers', 'lead:schedule_test_drives', 'vehicle:reserve', 'user:view_own', 'user:edit_own']
            WHEN 'seller' THEN ARRAY['vehicle:view', 'vehicle:create', 'vehicle:manage_own', 'marketplace:browse', 'lead:create', 'lead:contact_sellers', 'lead:manage_own', 'user:view_own', 'user:edit_own', 'history:lead_view', 'history:transaction_view']
            WHEN 'admin' THEN ARRAY['vehicle:manage_all', 'lead:manage_all', 'user:manage_all', 'system:admin_dashboard', 'system:reports']
            ELSE ARRAY[]::text[]
        END) AS permission
    FROM user_roles ur
    WHERE ur.revoked_at IS NULL
),
explicit_permissions AS (
    SELECT
        user_id,
        permission::text
    FROM user_permissions
    WHERE expires_at IS NULL OR expires_at > NOW()
)
SELECT DISTINCT
    u.id as user_id,
    u.email,
    COALESCE(rp.permission, ep.permission) as permission
FROM users u
LEFT JOIN role_permissions rp ON u.id = rp.user_id
LEFT JOIN explicit_permissions ep ON u.id = ep.user_id
WHERE u.status = 'active'
AND (rp.permission IS NOT NULL OR ep.permission IS NOT NULL);
```

## Testing Strategy

### Unit Tests
```typescript
describe('User Domain', () => {
  describe('User Entity', () => {
    it('should register user with valid data', () => {
      const email = new EmailAddress('test@example.com');
      const password = new Password('SecurePass123!');
      const profile = createValidBasicProfile();

      const user = User.register(email, password, profile);

      expect(user.id).toBeDefined();
      expect(user.profile.contactInfo.email).toEqual(email);
    });

    it('should require MFA for verified users', () => {
      const user = createVerifiedUser();
      const context = createAuthContext();

      const result = user.authenticate(validPassword, context);

      expect(result.requiresMFA).toBe(true);
    });

    it('should grant role only with sufficient verification', () => {
      const user = createUnverifiedUser();

      expect(() => user.grantRole(UserRole.SELLER, adminUserId))
        .toThrow(InsufficientVerificationError);
    });
  });

  describe('UserPermissions', () => {
    it('should calculate correct permissions for role', () => {
      const permissions = UserPermissions.createDefault();
      permissions.grantRole(UserRole.CUSTOMER);

      expect(permissions.hasPermission(Permission.CREATE_LEADS)).toBe(true);
      expect(permissions.hasPermission(Permission.MANAGE_ALL_VEHICLES)).toBe(false);
    });
  });
});
```

### Integration Tests
```typescript
describe('Authentication Integration', () => {
  let authService: AuthenticationService;
  let userRepository: UserRepository;

  beforeEach(async () => {
    // Setup test dependencies
  });

  it('should complete full authentication flow', async () => {
    // 1. Register user
    const registrationData = createValidRegistrationData();
    const user = await registrationService.registerUser(registrationData);

    // 2. Verify email
    await verificationService.verifyEmail(user.id, emailVerificationToken);

    // 3. Login
    const context = createAuthContext();
    const result = await authService.authenticate(
      registrationData.email,
      registrationData.password,
      context
    );

    expect(result.isSuccess).toBe(true);
    expect(result.accessToken).toBeDefined();
  });

  it('should handle concurrent login attempts', async () => {
    const user = await createTestUser();
    const context = createAuthContext();

    const loginPromises = Array(5).fill(0).map(() =>
      authService.authenticate(user.email, validPassword, context)
    );

    const results = await Promise.allSettled(loginPromises);

    // All should succeed (no race conditions)
    expect(results.every(r => r.status === 'fulfilled')).toBe(true);
  });
});
```

Este dominio de Usuarios y Autenticación proporciona una base sólida de seguridad para toda la plataforma Carvento, implementando mejores prácticas de autenticación, autorización y verificación de identidad.
# Estrategia de Testing y Quality Assurance

## Visión de Calidad

La estrategia de testing de Carvento está diseñada para garantizar la máxima confiabilidad, performance y seguridad de la plataforma, especialmente considerando la naturaleza crítica de las transacciones financieras en subastas en tiempo real. Implementamos un enfoque integral que combina testing automatizado, manual y continuo.

## Filosofía de Testing

### Principios Fundamentales
- **Testing First**: TDD/BDD en desarrollo de nuevas funcionalidades
- **Shift Left**: Testing temprano en el ciclo de desarrollo
- **Continuous Testing**: Integración continua con gates de calidad
- **Risk-Based Testing**: Priorización basada en impacto de negocio
- **Data-Driven Decisions**: Métricas de calidad para toma de decisiones

### Niveles de Testing
```
E2E Tests (5%)          ← Critical User Journeys
Integration Tests (25%) ← API & Service Integration
Unit Tests (70%)        ← Business Logic & Components
```

## Estrategia por Capas

### 1. Unit Testing (70% - Cobertura mínima 80%)

#### Frontend Unit Testing (Angular/Jest)
```typescript
// Ejemplo: Vehicle Component Testing
describe('VehicleCardComponent', () => {
  let component: VehicleCardComponent;
  let fixture: ComponentFixture<VehicleCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleCardComponent],
      providers: [
        { provide: VehicleService, useValue: mockVehicleService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleCardComponent);
    component = fixture.componentInstance;
  });

  describe('Vehicle Display', () => {
    it('should display vehicle information correctly', () => {
      const mockVehicle = createMockVehicle();
      component.vehicle = mockVehicle;
      fixture.detectChanges();

      expect(screen.getByText(mockVehicle.make)).toBeInTheDocument();
      expect(screen.getByText(mockVehicle.model)).toBeInTheDocument();
      expect(screen.getByText(mockVehicle.year.toString())).toBeInTheDocument();
    });

    it('should handle missing vehicle data gracefully', () => {
      component.vehicle = null;
      fixture.detectChanges();

      expect(screen.getByText('No vehicle data available')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should emit vehicle selection event when clicked', () => {
      const mockVehicle = createMockVehicle();
      component.vehicle = mockVehicle;

      spyOn(component.vehicleSelected, 'emit');

      const cardElement = screen.getByTestId('vehicle-card');
      fireEvent.click(cardElement);

      expect(component.vehicleSelected.emit).toHaveBeenCalledWith(mockVehicle);
    });

    it('should navigate to vehicle details on view details click', () => {
      const mockVehicle = createMockVehicle();
      component.vehicle = mockVehicle;
      fixture.detectChanges();

      const viewDetailsButton = screen.getByTestId('view-details-button');
      fireEvent.click(viewDetailsButton);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/vehicles', mockVehicle.id]);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const mockVehicle = createMockVehicle();
      component.vehicle = mockVehicle;
      fixture.detectChanges();

      const cardElement = screen.getByRole('article');
      expect(cardElement).toHaveAttribute('aria-label', `Vehicle: ${mockVehicle.make} ${mockVehicle.model}`);
    });

    it('should be keyboard navigable', () => {
      const mockVehicle = createMockVehicle();
      component.vehicle = mockVehicle;
      fixture.detectChanges();

      const cardElement = screen.getByTestId('vehicle-card');
      expect(cardElement).toHaveAttribute('tabindex', '0');
    });
  });
});
```

#### Backend Unit Testing (NestJS/Jest)
```typescript
// Ejemplo: Auction Service Testing
describe('AuctionService', () => {
  let service: AuctionService;
  let repository: MockRepository<Auction>;
  let eventBus: MockEventBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuctionService,
        {
          provide: getRepositoryToken(Auction),
          useClass: MockRepository,
        },
        {
          provide: EventBus,
          useClass: MockEventBus,
        },
      ],
    }).compile();

    service = module.get<AuctionService>(AuctionService);
    repository = module.get(getRepositoryToken(Auction));
    eventBus = module.get(EventBus);
  });

  describe('placeBid', () => {
    it('should place a valid bid successfully', async () => {
      // Arrange
      const auction = createMockAuction({ status: AuctionStatus.ACTIVE });
      const bidAmount = Money.fromNumber(25000, 'USD');
      const bidderId = new UserId('bidder-123');

      repository.findOne.mockResolvedValue(auction);
      repository.save.mockResolvedValue(auction);

      // Act
      const result = await service.placeBid(auction.id, bidderId, bidAmount);

      // Assert
      expect(result.bid.amount).toEqual(bidAmount);
      expect(result.isHighestBid).toBe(true);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPrice: bidAmount
        })
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(BidPlacedEvent)
      );
    });

    it('should reject bid if amount is too low', async () => {
      // Arrange
      const auction = createMockAuction({
        status: AuctionStatus.ACTIVE,
        currentPrice: Money.fromNumber(24000, 'USD'),
        minimumIncrement: Money.fromNumber(500, 'USD')
      });
      const lowBidAmount = Money.fromNumber(24200, 'USD'); // Less than minimum increment

      repository.findOne.mockResolvedValue(auction);

      // Act & Assert
      await expect(
        service.placeBid(auction.id, new UserId('bidder-123'), lowBidAmount)
      ).rejects.toThrow(InvalidBidAmountError);

      expect(repository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should reject bid if auction is not active', async () => {
      // Arrange
      const auction = createMockAuction({ status: AuctionStatus.ENDED });
      const bidAmount = Money.fromNumber(25000, 'USD');

      repository.findOne.mockResolvedValue(auction);

      // Act & Assert
      await expect(
        service.placeBid(auction.id, new UserId('bidder-123'), bidAmount)
      ).rejects.toThrow(AuctionNotActiveError);
    });
  });

  describe('startAuction', () => {
    it('should start scheduled auction successfully', async () => {
      // Arrange
      const auction = createMockAuction({ status: AuctionStatus.SCHEDULED });
      repository.findOne.mockResolvedValue(auction);
      repository.save.mockResolvedValue(auction);

      // Act
      await service.startAuction(auction.id);

      // Assert
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AuctionStatus.ACTIVE
        })
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(AuctionStartedEvent)
      );
    });
  });
});
```

### 2. Integration Testing (25%)

#### API Integration Tests
```typescript
// Ejemplo: Auction API Integration Tests
describe('Auctions API (Integration)', () => {
  let app: INestApplication;
  let testDb: TestDatabase;
  let authToken: string;

  beforeAll(async () => {
    testDb = await TestDatabase.create();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(DataSource)
    .useValue(testDb.dataSource)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Authenticate test user
    authToken = await authenticateTestUser(app);
  });

  afterAll(async () => {
    await testDb.cleanup();
    await app.close();
  });

  beforeEach(async () => {
    await testDb.clearTables();
    await seedTestData(testDb);
  });

  describe('POST /auctions/:id/bids', () => {
    it('should place bid and update auction state', async () => {
      // Arrange
      const auction = await createTestAuction(testDb, {
        status: AuctionStatus.ACTIVE,
        startingPrice: 20000,
        minimumIncrement: 500
      });

      const bidRequest = {
        amount: 25000
      };

      // Act
      const response = await request(app.getHttpServer())
        .post(`/auctions/${auction.id}/bids`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(bidRequest)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        bid: {
          amount: 25000,
          bidderId: expect.any(String)
        },
        isHighestBid: true,
        totalBids: 1
      });

      // Verify database state
      const updatedAuction = await testDb.findAuction(auction.id);
      expect(updatedAuction.currentPrice).toBe(25000);
      expect(updatedAuction.totalBids).toBe(1);

      // Verify event was published
      expect(testEventBus.getPublishedEvents()).toContainEqual(
        expect.objectContaining({
          type: 'BidPlacedEvent',
          auctionId: auction.id
        })
      );
    });

    it('should handle concurrent bids correctly', async () => {
      // Arrange
      const auction = await createTestAuction(testDb);
      const bidRequests = [
        { amount: 25000 },
        { amount: 25500 },
        { amount: 26000 }
      ];

      // Act - Submit concurrent bids
      const responses = await Promise.allSettled(
        bidRequests.map(bid =>
          request(app.getHttpServer())
            .post(`/auctions/${auction.id}/bids`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(bid)
        )
      );

      // Assert - All bids should be accepted in order
      const successfulResponses = responses
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value);

      expect(successfulResponses).toHaveLength(3);

      // Verify final state
      const finalAuction = await testDb.findAuction(auction.id);
      expect(finalAuction.currentPrice).toBe(26000);
      expect(finalAuction.totalBids).toBe(3);
    });
  });

  describe('WebSocket Integration', () => {
    it('should broadcast bid updates to connected clients', async (done) => {
      // Arrange
      const auction = await createTestAuction(testDb);
      const client1 = io(`http://localhost:${port}/auctions`);
      const client2 = io(`http://localhost:${port}/auctions`);

      let receivedUpdates = 0;
      const expectedUpdate = {
        auctionId: auction.id,
        amount: 25000,
        isHighest: true
      };

      // Setup listeners
      [client1, client2].forEach(client => {
        client.on('newBid', (data) => {
          expect(data).toMatchObject(expectedUpdate);
          receivedUpdates++;

          if (receivedUpdates === 2) {
            client1.disconnect();
            client2.disconnect();
            done();
          }
        });
      });

      // Join auction rooms
      await Promise.all([
        new Promise(resolve => client1.emit('joinAuction', { auctionId: auction.id }, resolve)),
        new Promise(resolve => client2.emit('joinAuction', { auctionId: auction.id }, resolve))
      ]);

      // Act - Place bid via HTTP
      await request(app.getHttpServer())
        .post(`/auctions/${auction.id}/bids`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 25000 });
    });
  });
});
```

#### Database Integration Tests
```typescript
describe('Vehicle Repository Integration', () => {
  let repository: VehicleRepository;
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await TestDatabase.create();
    repository = new TypeOrmVehicleRepository(testDb.dataSource);
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  beforeEach(async () => {
    await testDb.clearTables();
  });

  describe('Complex Queries', () => {
    it('should find vehicles with advanced search criteria', async () => {
      // Arrange
      await seedVehicleTestData(testDb, [
        { make: 'Toyota', model: 'Camry', year: 2018, price: 22000, mileage: 45000 },
        { make: 'Toyota', model: 'Camry', year: 2019, price: 25000, mileage: 30000 },
        { make: 'Honda', model: 'Civic', year: 2018, price: 20000, mileage: 40000 },
        { make: 'BMW', model: 'X5', year: 2020, price: 45000, mileage: 15000 }
      ]);

      const searchCriteria = new VehicleSearchCriteria({
        make: 'Toyota',
        yearRange: { min: 2018, max: 2019 },
        priceRange: { min: 20000, max: 30000 },
        mileageRange: { max: 50000 },
        sortBy: 'price',
        sortOrder: 'asc'
      });

      // Act
      const results = await repository.findByCriteria(searchCriteria);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].price).toBeLessThan(results[1].price);
      expect(results.every(v => v.make === 'Toyota')).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const vehicleCount = 25;
      await seedMultipleVehicles(testDb, vehicleCount);

      const pagination = new PaginationOptions(2, 10); // Page 2, 10 items per page

      // Act
      const [results, totalCount] = await repository.findWithPagination(
        new VehicleSearchCriteria({}),
        pagination
      );

      // Assert
      expect(results).toHaveLength(10);
      expect(totalCount).toBe(vehicleCount);
      expect(results[0].id).not.toEqual(results[9].id);
    });
  });

  describe('Transaction Handling', () => {
    it('should rollback on error during vehicle creation', async () => {
      // Arrange
      const vehicleData = createValidVehicleData();

      // Mock error during photo upload
      jest.spyOn(repository, 'savePhotos').mockRejectedValue(new Error('Upload failed'));

      // Act & Assert
      await expect(
        repository.createVehicleWithPhotos(vehicleData, [mockPhotoFile])
      ).rejects.toThrow('Upload failed');

      // Verify rollback
      const vehicleCount = await repository.count();
      expect(vehicleCount).toBe(0);
    });
  });
});
```

### 3. End-to-End Testing (5%)

#### Critical User Journeys
```typescript
// Ejemplo: Complete Auction Flow E2E Test
describe('Complete Auction Flow', () => {
  let page: Page;
  let context: BrowserContext;

  beforeAll(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await context.close();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    await seedTestData();
  });

  test('complete auction participation flow', async () => {
    // 1. User Registration and Verification
    await test.step('User registers and verifies account', async () => {
      await page.goto('/register');

      await page.fill('[data-testid="email"]', 'bidder@example.com');
      await page.fill('[data-testid="password"]', 'SecurePass123!');
      await page.fill('[data-testid="firstName"]', 'John');
      await page.fill('[data-testid="lastName"]', 'Doe');
      await page.click('[data-testid="register-button"]');

      // Verify email confirmation page
      await expect(page.locator('[data-testid="email-verification-message"]')).toBeVisible();

      // Simulate email verification
      await verifyEmailForUser('bidder@example.com');
    });

    // 2. Login and Navigation
    await test.step('User logs in and navigates to auctions', async () => {
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'bidder@example.com');
      await page.fill('[data-testid="password"]', 'SecurePass123!');
      await page.click('[data-testid="login-button"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');

      // Navigate to active auctions
      await page.click('[data-testid="nav-auctions"]');
      await expect(page).toHaveURL('/auctions/active');
    });

    // 3. Auction Participation
    await test.step('User participates in live auction', async () => {
      // Find an active auction
      const firstAuction = page.locator('[data-testid="auction-card"]').first();
      await expect(firstAuction).toBeVisible();

      // Click to join auction
      await firstAuction.click();

      // Should be on auction details page
      await expect(page.locator('[data-testid="auction-details"]')).toBeVisible();

      // Register for auction if not already registered
      const registerButton = page.locator('[data-testid="register-for-auction"]');
      if (await registerButton.isVisible()) {
        await registerButton.click();
        await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
      }

      // Place a bid
      const currentPrice = await page.locator('[data-testid="current-price"]').textContent();
      const bidAmount = parseFloat(currentPrice!.replace(/[^0-9.]/g, '')) + 500;

      await page.fill('[data-testid="bid-amount"]', bidAmount.toString());
      await page.click('[data-testid="place-bid-button"]');

      // Wait for bid confirmation
      await expect(page.locator('[data-testid="bid-success-message"]')).toBeVisible();

      // Verify bid appears in bid history
      await expect(page.locator('[data-testid="bid-history"]')).toContainText(bidAmount.toString());
    });

    // 4. Real-time Updates
    await test.step('User sees real-time auction updates', async () => {
      // Open second browser context for another bidder
      const secondContext = await browser.newContext();
      const secondPage = await secondContext.newPage();

      // Login as different user
      await loginAsUser(secondPage, 'bidder2@example.com');
      await secondPage.goto(page.url()); // Same auction page

      // Place competing bid
      const currentPrice = await secondPage.locator('[data-testid="current-price"]').textContent();
      const higherBid = parseFloat(currentPrice!.replace(/[^0-9.]/g, '')) + 1000;

      await secondPage.fill('[data-testid="bid-amount"]', higherBid.toString());
      await secondPage.click('[data-testid="place-bid-button"]');

      // First user should see the update
      await expect(page.locator('[data-testid="current-price"]')).toContainText(higherBid.toString());
      await expect(page.locator('[data-testid="outbid-notification"]')).toBeVisible();

      await secondContext.close();
    });

    // 5. Auction Completion
    await test.step('Auction completes and user sees results', async () => {
      // Simulate auction end (this would be done via admin panel or automatic)
      await endAuctionViaAPI(getCurrentAuctionId());

      // User should see auction ended message
      await expect(page.locator('[data-testid="auction-ended-message"]')).toBeVisible();

      // Check if user won or lost
      const resultMessage = page.locator('[data-testid="auction-result"]');
      await expect(resultMessage).toBeVisible();

      const isWinner = await resultMessage.textContent();
      if (isWinner?.includes('Congratulations')) {
        // User won - verify next steps
        await expect(page.locator('[data-testid="payment-instructions"]')).toBeVisible();
      } else {
        // User lost - verify consolation message
        await expect(page.locator('[data-testid="better-luck-message"]')).toBeVisible();
      }
    });
  });

  test('auction administration flow', async () => {
    await test.step('Admin creates and manages auction', async () => {
      // Login as admin
      await loginAsAdmin(page);

      // Navigate to admin panel
      await page.goto('/admin/auctions');

      // Create new auction
      await page.click('[data-testid="create-auction-button"]');

      // Fill auction form
      await page.selectOption('[data-testid="vehicle-select"]', { index: 0 });
      await page.fill('[data-testid="starting-price"]', '20000');
      await page.fill('[data-testid="reserve-price"]', '25000');

      // Set start time (30 seconds from now for testing)
      const startTime = new Date(Date.now() + 30000);
      await page.fill('[data-testid="start-time"]', startTime.toISOString().slice(0, 16));

      await page.click('[data-testid="schedule-auction-button"]');

      // Verify auction was created
      await expect(page.locator('[data-testid="auction-created-success"]')).toBeVisible();

      // Start auction manually
      await page.click('[data-testid="start-auction-button"]');

      // Verify auction is now active
      await expect(page.locator('[data-testid="auction-status"]')).toContainText('Active');
    });
  });

  // Performance Testing Integration
  test('auction handles high load', async () => {
    await test.step('Multiple users bid simultaneously', async () => {
      // Create multiple browser contexts
      const bidders = await Promise.all(
        Array.from({ length: 10 }, async (_, i) => {
          const context = await browser.newContext();
          const page = await context.newPage();
          await loginAsUser(page, `bidder${i}@example.com`);
          return { context, page };
        })
      );

      // Navigate all to same auction
      const auctionUrl = '/auctions/test-auction-123';
      await Promise.all(
        bidders.map(({ page }) => page.goto(auctionUrl))
      );

      // Simulate concurrent bidding
      const bidPromises = bidders.map(({ page }, index) =>
        page.evaluate(async (bidAmount) => {
          // Use JavaScript to place bid without UI interaction for speed
          const response = await fetch('/api/auctions/test-auction-123/bids', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({ amount: bidAmount })
          });
          return response.status;
        }, 20000 + (index * 100))
      );

      const results = await Promise.allSettled(bidPromises);

      // Verify most bids were successful
      const successfulBids = results.filter(r =>
        r.status === 'fulfilled' && r.value === 201
      ).length;

      expect(successfulBids).toBeGreaterThan(7); // At least 70% success rate

      // Cleanup
      await Promise.all(bidders.map(({ context }) => context.close()));
    });
  });
});
```

## Testing Automatizado

### Configuración de CI/CD Testing Pipeline

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: carvento_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run unit tests
      run: |
        npm run test:unit -- --coverage --watchAll=false
        npm run test:unit:backend -- --coverage --watchAll=false

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
        flags: unittests
        fail_ci_if_error: true

    - name: Quality Gate - Coverage Threshold
      run: |
        COVERAGE=$(node -p "require('./coverage/coverage-summary.json').total.lines.pct")
        if (( $(echo "$COVERAGE < 80" | bc -l) )); then
          echo "Coverage $COVERAGE% is below threshold of 80%"
          exit 1
        fi

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: carvento_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run database migrations
      run: npm run db:migrate:test

    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:test_password@localhost:5432/carvento_test
        REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests

    steps:
    - uses: actions/checkout@v3

    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright
      run: npx playwright install

    - name: Start application
      run: |
        npm run build
        npm run start:test &
        sleep 30 # Wait for app to start

    - name: Run E2E tests
      run: npm run test:e2e
      env:
        BASE_URL: http://localhost:3000

    - name: Upload E2E artifacts
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: e2e-artifacts
        path: |
          e2e-results/
          screenshots/
          videos/

  security-tests:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Run OWASP ZAP scan
      uses: zaproxy/action-full-scan@v0.4.0
      with:
        target: 'http://localhost:3000'
        rules_file_name: '.zap/rules.tsv'
        cmd_options: '-a'

    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

  performance-tests:
    runs-on: ubuntu-latest
    needs: integration-tests

    steps:
    - uses: actions/checkout@v3

    - name: Run load tests
      run: |
        npm run start:test &
        sleep 30
        npm run test:load

    - name: Upload performance results
      uses: actions/upload-artifact@v3
      with:
        name: performance-results
        path: performance-results/
```

### Test Data Management

```typescript
// test/utils/test-data-factory.ts
export class TestDataFactory {
  static createVehicle(overrides: Partial<VehicleData> = {}): VehicleData {
    return {
      id: faker.datatype.uuid(),
      vin: faker.vehicle.vin(),
      make: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      year: faker.datatype.number({ min: 2010, max: 2023 }),
      mileage: faker.datatype.number({ min: 0, max: 200000 }),
      color: faker.vehicle.color(),
      engineType: faker.helpers.arrayElement(['gasoline', 'diesel', 'hybrid', 'electric']),
      transmission: faker.helpers.arrayElement(['manual', 'automatic']),
      status: VehicleStatus.AVAILABLE,
      createdAt: faker.date.past(),
      ...overrides
    };
  }

  static createAuction(overrides: Partial<AuctionData> = {}): AuctionData {
    const startTime = faker.date.future();
    const endTime = new Date(startTime.getTime() + (2 * 60 * 60 * 1000)); // 2 hours later

    return {
      id: faker.datatype.uuid(),
      vehicleId: faker.datatype.uuid(),
      status: AuctionStatus.SCHEDULED,
      startTime,
      endTime,
      startingPrice: faker.datatype.number({ min: 10000, max: 50000 }),
      reservePrice: faker.datatype.number({ min: 15000, max: 60000 }),
      minimumIncrement: 500,
      currentPrice: null,
      totalBids: 0,
      ...overrides
    };
  }

  static createUser(overrides: Partial<UserData> = {}): UserData {
    return {
      id: faker.datatype.uuid(),
      email: faker.internet.email(),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      phone: faker.phone.number(),
      emailVerified: true,
      phoneVerified: false,
      roles: [UserRole.BIDDER],
      createdAt: faker.date.past(),
      ...overrides
    };
  }

  static createBid(overrides: Partial<BidData> = {}): BidData {
    return {
      id: faker.datatype.uuid(),
      auctionId: faker.datatype.uuid(),
      bidderId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 20000, max: 60000 }),
      timestamp: faker.date.recent(),
      ...overrides
    };
  }
}

// test/utils/database-seeder.ts
export class DatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  async seedTestData(): Promise<TestDataSet> {
    const vehicles = await this.seedVehicles(10);
    const users = await this.seedUsers(20);
    const auctions = await this.seedAuctions(5, vehicles, users);
    const bids = await this.seedBids(auctions, users);

    return {
      vehicles,
      users,
      auctions,
      bids
    };
  }

  private async seedVehicles(count: number): Promise<Vehicle[]> {
    const vehicles = Array.from({ length: count }, () =>
      TestDataFactory.createVehicle()
    );

    return await this.dataSource.getRepository(Vehicle).save(vehicles);
  }

  private async seedUsers(count: number): Promise<User[]> {
    const users = Array.from({ length: count }, (_, index) =>
      TestDataFactory.createUser({
        email: `testuser${index}@example.com`,
        roles: index < 5 ? [UserRole.ADMIN] : [UserRole.BIDDER]
      })
    );

    return await this.dataSource.getRepository(User).save(users);
  }

  async clearAllTables(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE ${entity.tableName} RESTART IDENTITY CASCADE;`);
    }
  }
}
```

## Quality Metrics y KPIs

### Métricas de Testing
```typescript
interface TestingMetrics {
  // Coverage Metrics
  overallCoverage: number;        // Target: >80%
  unitTestCoverage: number;       // Target: >85%
  integrationCoverage: number;    // Target: >75%

  // Test Execution Metrics
  testExecutionTime: number;      // Target: <10 minutes
  testSuccessRate: number;        // Target: >95%
  flakyTestPercentage: number;    // Target: <5%

  // Quality Metrics
  bugDetectionRate: number;       // Target: >90%
  productionBugEscapeRate: number; // Target: <2%
  criticalBugFixTime: number;     // Target: <4 hours

  // Performance Metrics
  loadTestPassRate: number;       // Target: 100%
  responseTimeCompliance: number; // Target: >95%
  concurrencyHandling: number;    // Target: >1000 users
}
```

### Continuous Monitoring
```typescript
// test/monitoring/test-metrics-collector.ts
export class TestMetricsCollector {
  async collectMetrics(): Promise<TestingMetrics> {
    const [
      coverageData,
      executionData,
      qualityData,
      performanceData
    ] = await Promise.all([
      this.getCoverageMetrics(),
      this.getExecutionMetrics(),
      this.getQualityMetrics(),
      this.getPerformanceMetrics()
    ]);

    return {
      ...coverageData,
      ...executionData,
      ...qualityData,
      ...performanceData
    };
  }

  private async getCoverageMetrics(): Promise<Partial<TestingMetrics>> {
    const coverageReport = await fs.readFile('./coverage/coverage-summary.json', 'utf8');
    const coverage = JSON.parse(coverageReport);

    return {
      overallCoverage: coverage.total.lines.pct,
      unitTestCoverage: coverage.unit?.lines.pct || 0,
      integrationCoverage: coverage.integration?.lines.pct || 0
    };
  }

  async publishMetrics(metrics: TestingMetrics): Promise<void> {
    // Send to monitoring system (CloudWatch, DataDog, etc.)
    await this.cloudWatchService.putMetrics([
      {
        MetricName: 'TestCoverage',
        Value: metrics.overallCoverage,
        Unit: 'Percent'
      },
      {
        MetricName: 'TestSuccessRate',
        Value: metrics.testSuccessRate,
        Unit: 'Percent'
      }
    ]);

    // Generate alerts if thresholds are not met
    if (metrics.overallCoverage < 80) {
      await this.alertService.send({
        level: 'warning',
        message: `Test coverage dropped to ${metrics.overallCoverage}%`,
        threshold: 80
      });
    }
  }
}
```

Esta estrategia de testing integral garantiza la calidad, confiabilidad y rendimiento de la plataforma Carvento a través de múltiples niveles de validación automatizada y continua.
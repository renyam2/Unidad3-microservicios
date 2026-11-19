package com.universidad.authserver.config;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyOperation;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.universidad.authserver.security.PasswordGrantAuthenticationConverter;
import com.universidad.authserver.security.PasswordGrantAuthenticationProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.authentication.ClientSecretAuthenticationProvider;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationCodeRequestAuthenticationProvider;
import org.springframework.security.oauth2.server.authorization.authentication.OAuth2AuthorizationConsentAuthenticationProvider;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.oauth2.server.authorization.InMemoryOAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.InMemoryOAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.web.SecurityFilterChain;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Duration;
import java.util.Set;

/**
 * Configuración del AuthServer (Fase 1 - Elian).
 *
 * - OAuth2 Authorization Server (Spring Authorization Server 1.5.x)
 * - JWT firmados con RSA (RS256), kid: auth-server-key
 * - Usuario en memoria: user / pass123 (rol USER)
 * - Cliente OAuth2: frontend / frontend-secret (grant types: password, authorization_code)
 * - Registro automático en Eureka (spring-cloud-starter-netflix-eureka-client)
 */
@Configuration
public class AuthorizationServerConfig {

    private static final String KEY_ID = "auth-server-key";
    private static final String ISSUER = "http://localhost:9000";

    /**
     * Par RSA de 2048 bits en memoria, único para todo el servidor
     * (firma de JWTs, endpoint /oauth2/jwks y decodificación).
     */
    @Bean
    public KeyPair rsaKeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        return generator.generateKeyPair();
    }

    /**
     * JWK público (sin clave privada) para el endpoint /oauth2/jwks.
     */
    @Bean
    public JWKSource<SecurityContext> jwkSource(KeyPair keyPair) {
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAKey publicRsaKey = new RSAKey(
                publicKey,
                KeyUse.SIGNATURE,
                Set.of(KeyOperation.SIGN, KeyOperation.VERIFY),
                JWSAlgorithm.RS256,
                KEY_ID,
                null, null, null, null, null);
        JWKSet jwkSet = new JWKSet(publicRsaKey);
        return (selector, context) -> selector.select(jwkSet);
    }

    /**
     * JwtEncoder con la clave privada completa: lo usa el JwtGenerator
     * por defecto del Authorization Server para emitir JWTs en el flujo
     * authorization_code.
     */
    @Bean
    public JwtEncoder jwtEncoder(KeyPair keyPair) {
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        RSAKey fullRsaKey = new RSAKey(
                publicKey, privateKey,
                KeyUse.SIGNATURE,
                Set.of(KeyOperation.SIGN, KeyOperation.VERIFY),
                JWSAlgorithm.RS256,
                KEY_ID,
                null, null, null, null, null);
        JWKSet jwkSet = new JWKSet(fullRsaKey);
        JWKSource<SecurityContext> signingJwkSource = (selector, context) -> selector.select(jwkSet);
        return new NimbusJwtEncoder(signingJwkSource);
    }

    /**
     * JwtDecoder para validar los JWTs emitidos (resource server / introspección).
     */
    @Bean
    public JwtDecoder jwtDecoder(KeyPair keyPair) {
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        return NimbusJwtDecoder.withPublicKey(publicKey).build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Usuario en memoria: user / pass123 (rol USER).
     */
    @Bean
    public UserDetailsService inMemoryUserDetailsService(PasswordEncoder passwordEncoder) {
        UserDetails user = User.withUsername("user")
                .password(passwordEncoder.encode("pass123"))
                .roles("USER")
                .build();
        return new InMemoryUserDetailsManager(user);
    }

    /**
     * Proveedor de autenticación expuesto como Bean: la autoconfiguración de
     * Spring Security (AuthenticationConfiguration / InitializeAuthenticationProviderBeanManagerConfigurer)
     * lo recoge para construir el AuthenticationManager usado por el form login.
     */
    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider(UserDetailsService userDetailsService,
                                                                PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    /**
     * AuthenticationManager usado por el PasswordGrantAuthenticationProvider
     * para autenticar al usuario (user/pass123) dentro del grant type "password".
     * No se registra en el SecurityFilterChain via HttpSecurity.authenticationManager(...):
     * si se hiciera, HttpSecurity ignoraria los providers que los configurers del
     * Authorization Server registran en el AuthenticationManagerBuilder compartido
     * (incluido el PasswordGrantAuthenticationProvider del token endpoint).
     * Dejando que HttpSecurity construya su AuthenticationManager desde el builder,
     * el ProviderManager final incluye: daoAuthenticationProvider (form login),
     * ClientSecretAuthenticationProvider (autenticacion de cliente),
     * OAuth2AuthorizationCodeRequest/ConsentAuthenticationProvider (endpoint /oauth2/authorize)
     * y el PasswordGrantAuthenticationProvider (endpoint /oauth2/token).
     */
    @Bean
    public AuthenticationManager authenticationManager(
            DaoAuthenticationProvider daoAuthenticationProvider,
            RegisteredClientRepository registeredClientRepository,
            OAuth2AuthorizationService authorizationService,
            OAuth2AuthorizationConsentService authorizationConsentService,
            PasswordEncoder passwordEncoder) {
        ClientSecretAuthenticationProvider clientSecretProvider =
                new ClientSecretAuthenticationProvider(registeredClientRepository, authorizationService);
        clientSecretProvider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(
                daoAuthenticationProvider,
                clientSecretProvider,
                new OAuth2AuthorizationCodeRequestAuthenticationProvider(
                        registeredClientRepository, authorizationService, authorizationConsentService),
                new OAuth2AuthorizationConsentAuthenticationProvider(
                        registeredClientRepository, authorizationService, authorizationConsentService));
    }

    /**
     * Cliente OAuth2 "frontend" con grant types password y authorization_code.
     * El client_secret se guarda codificado (BCrypt): el filtro de autenticación
     * de cliente del Authorization Server (ClientSecretAuthenticationProvider)
     * valida el secreto con PasswordEncoder antes de llegar al token endpoint.
     */
    @Bean
    public RegisteredClientRepository registeredClientRepository(PasswordEncoder passwordEncoder) {
        RegisteredClient client = RegisteredClient.withId("frontend")
                .clientId("frontend")
                .clientSecret(passwordEncoder.encode("frontend-secret"))
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.PASSWORD)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("http://localhost:5500/callback")
                .scope("read")
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofMinutes(30))
                        .build())
                .build();
        return new InMemoryRegisteredClientRepository(client);
    }

    @Bean
    public OAuth2AuthorizationService authorizationService() {
        return new InMemoryOAuth2AuthorizationService();
    }

    @Bean
    public OAuth2AuthorizationConsentService authorizationConsentService() {
        return new InMemoryOAuth2AuthorizationConsentService();
    }

    /**
     * Proveedor del grant type "password" (no soportado nativamente por
     * Spring Authorization Server).
     */
    @Bean
    public PasswordGrantAuthenticationProvider passwordGrantAuthenticationProvider(
            RegisteredClientRepository registeredClientRepository,
            AuthenticationManager authenticationManager,
            PasswordEncoder passwordEncoder,
            KeyPair keyPair) {
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        return new PasswordGrantAuthenticationProvider(
                registeredClientRepository,
                authenticationManager,
                passwordEncoder,
                privateKey,
                ISSUER,
                KEY_ID);
    }

    @Bean
    public SecurityFilterChain authorizationServerSecurityFilterChain(
            HttpSecurity http,
            DaoAuthenticationProvider daoAuthenticationProvider,
            PasswordGrantAuthenticationProvider passwordGrantProvider) throws Exception {
        http
                .authenticationProvider(daoAuthenticationProvider)
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/oauth2/**", "/.well-known/**", "/actuator/health", "/login").permitAll()
                        .anyRequest().authenticated())
                .formLogin();

        OAuth2AuthorizationServerConfigurer oauth2 = OAuth2AuthorizationServerConfigurer.authorizationServer();
        http.apply(oauth2);
        oauth2.authorizationServerSettings(
                AuthorizationServerSettings.builder()
                        .issuer(ISSUER)
                        .build());
        oauth2.tokenEndpoint(tokenEndpoint -> tokenEndpoint
                .accessTokenRequestConverter(new PasswordGrantAuthenticationConverter())
                .authenticationProvider(passwordGrantProvider));

        return http.build();
    }
}

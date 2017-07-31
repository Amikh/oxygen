/*
 * Copyright (C) 2015-2017 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
 
using OpenQA.Selenium;
using OpenQA.Selenium.Remote;
using System;
using System.Collections.Generic;
using System.Net;
using System.Reflection;
using System.Threading;

namespace CloudBeat.Oxygen.Modules
{
    public class ModuleWeb : Module, IModule
	{
        private enum ScreenshotMode
        {
            Never,
            OnError,
            OnAction,	// if step is action or error occured
            Always
        }

        public SeleniumDriver driver { get; private set; }
        private Proxy proxy = null;
        private ScreenshotMode screenshotMode = ScreenshotMode.OnError;
        private bool fetchStats = false;
		private bool reopenBrowserOnIteration = false;
        private long prevNavigationStart = long.MinValue;
		private bool autoInitDriver = false;
		private string seleniumUrl;
        private bool proxyEnabled;
        private string proxyExe;
        private string proxyKey;
        private string proxyCer;
		private DesiredCapabilities capabilities;
        public string prevTransaction { get; private set; }

        private IDictionary<string, string> transactions = new Dictionary<string, string>();

		#region Defauts
		private const string DEFAULT_BROWSER_NAME = "internetexplorer"; // FIXME: default is not needed. browser should be mandatory?
		private const int PROXY_CONN_RETRY_COUNT = 10;
		private const int SELENIUM_CONN_RETRY_COUNT = 2;
		#endregion

		#region Argument Names
        const string ARG_PROXY_ENABLED = "proxyEnabled";
        const string ARG_PROXY_EXE = "proxyExe";
        const string ARG_PROXY_KEY = "proxyKey";
        const string ARG_PROXY_CER = "proxyCer";
        const string ARG_SELENIUM_URL = "seleniumUrl";
        const string ARG_INIT_DRIVER = "initDriver";
        const string ARG_BROWSER_NAME = "browserName";
		const string ARG_REOPEN_BROWSER = "reopenBrowser";
		const string ARG_SCREENSHOT_MODE = "screenshots";
        const string ARG_FETCH_STATS = "fetchStats";
		#endregion

		public ModuleWeb()
		{
		}

		#region General Public Functions

		public object IterationStarted()
		{
			// initialize selenium driver if auto init option is on and the driver is not initialized already
            if (!IsInitialized && autoInitDriver)
				InitializeSeleniumDriver();
			return null;
		}

        public object IterationEnded()
		{
			if (reopenBrowserOnIteration)
				Dispose();

            // har won't be fetched for last transaction, so we do it here
            if (proxy != null)
            {
                // there might be no transactions set if test fails before web.transaction command
                if (prevTransaction != null)
                {
                    String har = proxy.HarGet();
                    transactions.Remove(prevTransaction);
                    transactions.Add(prevTransaction, har);
                }
                proxy.HarReset();
            }

			return transactions;
		}

		public bool Initialize(Dictionary<string, string> args, ExecutionContext ctx)
		{
			this.ctx = ctx;

            proxyEnabled = args.ContainsKey(ARG_PROXY_ENABLED) && args[ARG_PROXY_ENABLED].Equals("true", StringComparison.InvariantCultureIgnoreCase);
            if (args.ContainsKey(ARG_PROXY_EXE) && !string.IsNullOrEmpty(args[ARG_PROXY_EXE]))
                proxyExe = args[ARG_PROXY_EXE];
            if (args.ContainsKey(ARG_PROXY_KEY) && !string.IsNullOrEmpty(args[ARG_PROXY_KEY]))
                proxyKey = args[ARG_PROXY_KEY];
            if (args.ContainsKey(ARG_PROXY_CER) && !string.IsNullOrEmpty(args[ARG_PROXY_CER]))
                proxyCer = args[ARG_PROXY_CER];

			if (args.ContainsKey(ARG_SELENIUM_URL) && !string.IsNullOrEmpty(args[ARG_SELENIUM_URL]))
				seleniumUrl = args[ARG_SELENIUM_URL];
			// screenshot mode
			if (args.ContainsKey(ARG_SCREENSHOT_MODE) && !string.IsNullOrEmpty(args[ARG_SCREENSHOT_MODE]))
			{
				var mode = args[ARG_SCREENSHOT_MODE];
				if (mode == "always")
					screenshotMode = ScreenshotMode.Always;
				else if (mode == "never")
					screenshotMode = ScreenshotMode.Never;
			}

            if (args.ContainsKey(ARG_FETCH_STATS) && args[ARG_FETCH_STATS].Equals("true", StringComparison.InvariantCultureIgnoreCase))
                fetchStats = true;

            autoInitDriver = args.ContainsKey(ARG_INIT_DRIVER) && args[ARG_INIT_DRIVER].Equals("true", StringComparison.InvariantCultureIgnoreCase);
            reopenBrowserOnIteration = args.ContainsKey(ARG_REOPEN_BROWSER) && args[ARG_REOPEN_BROWSER].Equals("true", StringComparison.InvariantCultureIgnoreCase);
			// initialize DesiredCapabilities with provided browser
			if (args.ContainsKey(ARG_BROWSER_NAME))
				capabilities = DCFactory.Get(args[ARG_BROWSER_NAME]);
			// add other capabilities if specified in arguments
			foreach (var key in args.Keys)
			{
				if (!key.StartsWith("web@cap:"))
					continue;
				if (capabilities == null)
					capabilities = new DesiredCapabilities();
				var capName = key.Replace("web@cap:", "");
				var capVal = args[key];
				capabilities.SetCapability(capName, capVal);
			}
			if (autoInitDriver)
				InitializeSeleniumDriver();
            IsInitialized = true;
			return true;
		}

		public void Quit()
		{
			Dispose();
		}

		protected void InitializeSeleniumDriver()
		{
            if (capabilities == null)
                capabilities = DCFactory.Get(DEFAULT_BROWSER_NAME);

            if (proxyEnabled)
            {
                proxy = Proxy.Create(proxyExe, proxyKey, proxyCer);

                OpenQA.Selenium.Proxy selProxy = new OpenQA.Selenium.Proxy
                {
                    HttpProxy = proxy.proxyAddr + ":" + proxy.proxyPort,
                    SslProxy = proxy.proxyAddr + ":" + proxy.proxyPort
                };
                capabilities.SetCapability(CapabilityType.Proxy, selProxy);
            }

            int connectAttempt = 0;
            while (true)
            {
                try
                {
                    driver = new SeleniumDriver(new Uri(seleniumUrl), capabilities, ctx);
                    break;
                }
                catch (Exception e)
                {
                    if (e is WebDriverException)
                    {
                        var we = e.InnerException as WebException;
                        if (we != null && we.Status == WebExceptionStatus.Timeout)
                        {
                            connectAttempt++;
                            if (connectAttempt >= SELENIUM_CONN_RETRY_COUNT)
                                throw;
                            Thread.Sleep(1000);	// wait a bit...
                            continue;
                        }
                    }
                    throw;
                }
            }

            driver._SetWindowSize(0, 0);
		}

        public bool Dispose()
        {
            try
            {
                if (driver != null)
					driver.Quit();
            } catch (Exception) {
            } // ignore exceptions

            try
            {
                if (proxy != null)
                    proxy.Dispose();
            }
            catch (Exception) {
            } // ignore exceptions
			driver = null;
            proxy = null;
            IsInitialized = false;
			return true;
        }
		#endregion

        // FIXME
		/*public void Init(string seleniumUrl, Dictionary<string, string> caps, bool resetDefaultCaps = true)
		{
			if (driver != null)
				throw new Exception("Selenium driver has been already initialized");
			// override current selenium url if new is passed in this function
			if (!string.IsNullOrEmpty(seleniumUrl))
				this.seleniumUrl = seleniumUrl;
			if (resetDefaultCaps || this.capabilities == null)
				this.capabilities = new DesiredCapabilities();
			if (caps != null)
			{
				foreach (var cap in caps)
					this.capabilities.SetCapability(cap.Key, cap.Value);
			}
			InitializeSeleniumDriver();
		}*/

       /* public string GetSessionId()
        {
            if (driver == null)
                throw new OxModuleInitializationException("Selenium driver is not initialized in web module");
            var sessionIdProperty = typeof(RemoteWebDriver).GetProperty("SessionId", BindingFlags.Instance | BindingFlags.NonPublic);
            SessionId sessionId = sessionIdProperty.GetValue(driver, null) as SessionId;
            if (sessionId != null)
                return sessionId.ToString();
            return null;
        }*/

        public void _Transaction(string name)
        {
            // throw in case we hit a duplicate transaction
            if (transactions.ContainsKey(name))
                throw new OxDuplicateTransactionException("Duplicate transaction found: \"" + name + "\". Transactions must be unique.");

            transactions.Add(name, null);

            // fetch har and save it under previous transaction
            // TODO: handle proxy related errors. this includes all other areas where proxy is used.
            if (proxy != null && prevTransaction != null)
            {
                String har = proxy.HarGet();
                transactions.Remove(prevTransaction);
                transactions.Add(prevTransaction, har);
                proxy.HarReset();
            }

            prevTransaction = name;
        }

		public override CommandResult ExecuteCommand(string name, params object[] args)
        {
            var result = new CommandResult(Name, name, args);

            Type[] paramTypes = null;
            try
            {
                paramTypes = ProcessArguments(args);
            }
            catch (OxVariableUndefined u)
            {
                return result.ErrorBase(ErrorType.VARIABLE_NOT_DEFINED, u.Message);
            }
            catch (Exception e)
            {
                return result.ErrorBase(ErrorType.UNKNOWN_ERROR, "Error processing arguments: " + e.Message);
            }

            // TODO: web.transaction needs refactoring
            if (name == "transaction")
            {
                try
                {
                    _Transaction(args[0] as string);
                }
                catch (OxDuplicateTransactionException dte)
                {
                    return result.ErrorBase(ErrorType.DUPLICATE_TRANSACTION, dte.Message);
                }
                catch (Exception e)
                {
                    return result.ErrorBase(ErrorType.UNKNOWN_ERROR, "Error processing transaction:" + e.Message);
                }
                return result.SuccessBase();
            }

            Exception exception = null;
            string screenShot = null;
            object retVal = null;
            try
            {
                Type dtype = driver.GetType();
                MethodInfo cmdMethod = dtype.GetMethod(SeleniumDriver.CMD_METHOD_PREFIX + name, BindingFlags.Public | BindingFlags.IgnoreCase | BindingFlags.Instance);
                if (cmdMethod == null)
                    throw new OxCommandNotImplementedException();

                retVal = cmdMethod.Invoke(driver, args);
                if ((screenshotMode == ScreenshotMode.OnAction && IsAction(name)) || screenshotMode == ScreenshotMode.Always)
                    screenShot = driver.TakeScreenshot();
            }
            catch (OxCommandNotImplementedException)
            {
                return result.ErrorBase(ErrorType.UNKNOWN_COMMAND, result.CommandExpression);
            }
            catch (ArgumentException)
            {
                return result.ErrorBase(ErrorType.SCRIPT_ERROR, "One of the arguments has an incorrect type.");
            }
            catch (TargetParameterCountException)
            {
                return result.ErrorBase(ErrorType.SCRIPT_ERROR, "Invalid number of arguments.");
            }
            catch (TargetInvocationException tie)
            {
                if (screenshotMode != ScreenshotMode.Never)
                {
                    if (tie.InnerException != null &&
                        (tie.InnerException is OxAssertionException ||
                        tie.InnerException is OxWaitForException ||
                        tie.InnerException is OxElementNotFoundException ||
                        tie.InnerException is OxElementNotVisibleException ||
                        tie.InnerException is OxOperationException ||
                        tie.InnerException is NoAlertPresentException ||
                        tie.InnerException is WebDriverTimeoutException))
                    {
                        try
                        {
                            screenShot = driver.TakeScreenshot();
                        } 
                        catch (Exception e) 
                        {
                            Console.Error.WriteLine("Error taking screenshot: " + e.Message);
                        }
                    }
                    else if (tie.InnerException != null && tie.InnerException is UnhandledAlertException)
                    {
                        // can't take screenshots when alert is showing. so capture whole screen
                        // this works only localy
                        // TODO: linux
                        /*if (Environment.OSVersion.Platform.ToString().StartsWith("Win"))
                        {
                            Rectangle bounds = System.Windows.Forms.Screen.GetBounds(Point.Empty);
                            using (Bitmap bitmap = new Bitmap(bounds.Width, bounds.Height))
                            {
                                using (Graphics g = Graphics.FromImage(bitmap))
                                {
                                    g.CopyFromScreen(Point.Empty, Point.Empty, bounds.Size);
                                }

                                ImageConverter converter = new ImageConverter();
                                var sb = (byte[])converter.ConvertTo(bitmap, typeof(byte[]));
                                screenShot = Convert.ToBase64String(sb);
                            }
                        }*/
                    }
                }

                // wrap Selenium exceptions. generaly commands throw Oxygen exceptions, however in certain 
                // cases like with ElementNotVisibleException it's simplier to just wrap it out here so we don't need to do it
                // for each FindElement().doSomething
                if (tie.InnerException is ElementNotVisibleException)
                    exception = new OxElementNotVisibleException();
                else if (tie.InnerException is WebDriverTimeoutException)
                    exception = new OxTimeoutException();
                else
                    exception = tie.InnerException;
            }
            catch (Exception e)
            {
                return result.ErrorBase(ErrorType.UNKNOWN_ERROR, e.Message);
            }

            result.IsAction = IsAction(name);
			result.Screenshot = screenShot;
			result.ReturnValue = retVal;
			result.IsSuccess = exception == null;
			if (exception != null)
                PopulateErrorDetails(exception, result);

            if (fetchStats && IsAction(name))
            {
                long navigationStart = 0;
                int domContentLoaded = 0;
                int load = 0;
                if (driver.GetPerformanceTimings(out domContentLoaded, out load, out navigationStart))
                {
                    // if navigateStart equals to the one we got from previous attempt
                    // it means we are still on the same page and don't need to record load/domContentLoaded times
                    if (prevNavigationStart == navigationStart)
                        load = domContentLoaded = 0;
                    else
                        prevNavigationStart = navigationStart;
                }
				result.DomContentLoadedEvent = domContentLoaded;
				result.LoadEvent = load;
            }

            return result;
        }

        private void PopulateErrorDetails(Exception e, CommandResult result)
		{
			var type = e.GetType();

            if (type == typeof(OxAssertionException))
                result.ErrorType = ErrorType.ASSERT.ToString();
            else if (type == typeof(NoSuchElementException))
                result.ErrorType = ErrorType.NO_SUCH_ELEMENT.ToString();
            else if (type == typeof(OxElementNotFoundException))
                result.ErrorType = ErrorType.NO_SUCH_ELEMENT.ToString();
            else if (type == typeof(OxElementNotVisibleException))
                result.ErrorType = ErrorType.ELEMENT_NOT_VISIBLE.ToString();
            else if (type == typeof(NoSuchFrameException))
                result.ErrorType = ErrorType.NO_SUCH_FRAME.ToString();
            else if (type == typeof(StaleElementReferenceException))
                result.ErrorType = ErrorType.STALE_ELEMENT_REFERENCE.ToString();
            else if (type == typeof(UnhandledAlertException))
            {
                result.ErrorMessage = "Alert text: " + driver._GetAlertText();
                result.ErrorType = ErrorType.UNEXPECTED_ALERT_OPEN.ToString();
            }
            else if (type == typeof(OxWaitForException))
                // This is thrown by any WaitFor* commands (e.g. _WaitForVisible)
                // and essentially implies a script level timeout.
                // By default the timeout is set to SeCommandProcessor.DEFAULT_WAIT_FOR_TIMEOUT but
                // can be overriden in the script using SetTimeout command.
                result.ErrorType = ErrorType.TIMEOUT.ToString();
            else if (type == typeof(OxTimeoutException))
                // This is thrown by any commands which rely on PageLoadTimeout (Open, Click, etc.)
                // and essentially implies a script level timeout.
                // By default the timeout is set to SeCommandProcessor.DEFAULT_PAGE_LOAD_TIMEOUT but
                // can be overriden in the script using SetTimeout command.
                result.ErrorType = ErrorType.TIMEOUT.ToString();
            else if (type == typeof(OxCommandNotImplementedException)) 
            {
                result.ErrorType = ErrorType.UNKNOWN_COMMAND.ToString();
                result.ErrorMessage = e.Message;
            }
            else if (type == typeof(OxOperationException))
            {
                result.ErrorType = ErrorType.INVALID_OPERATION.ToString();
                result.ErrorMessage = e.Message;
            }
            else if (type == typeof(OxXMLExtractException) || type == typeof(OxXMLtoJSONConvertException)) 
            {
                result.ErrorType = ErrorType.XML_ERROR.ToString();
                result.ErrorMessage = e.Message;
            }
            else if (type == typeof(NoAlertPresentException))
                result.ErrorType = ErrorType.NO_ALERT_OPEN_ERROR.ToString();
            else if (type == typeof(OxBrowserJSExecutionException))
            {
                result.ErrorType = ErrorType.BROWSER_JS_EXECUTE_ERROR.ToString();
                result.ErrorMessage = e.Message;
            }
            else
            {
                result.ErrorMessage = e.GetType().Name + ": " + e.Message;
                result.ErrorStackTrace = e.StackTrace;
                result.ErrorType = ErrorType.UNKNOWN_ERROR.ToString();
            }
		}

        private static HashSet<string> actions = new HashSet<string>() 
        {
            "click", "open", "doubleclick"
        };

        private bool IsAction(string cmdName)
        {
            return actions.Contains(cmdName.ToLowerInvariant());
        }
	}
}